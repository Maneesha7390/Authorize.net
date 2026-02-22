import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionStatus, TransactionType } from '../../schemas/transaction.schema';
import { Refund } from '../../schemas/refund.schema';
import { Customer } from '../../schemas/customer.schema';
import { PaymentProfile } from '../../schemas/payment-profile.schema';
import { AuthorizeNetService } from '../../common/authorize-net.service';
import { ChargeProfileDto, OneTimePaymentDto } from './dto/charge-profile.dto';
import { RefundDto } from './dto/refund.dto';
import { OneTimeOpaquePaymentDto } from './dto/charge-opaque.dto';
@Injectable()
export class PaymentsService {
    constructor(
        @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
        @InjectModel(Refund.name) private refundModel: Model<Refund>,
        @InjectModel(Customer.name) private customerModel: Model<Customer>,
        @InjectModel(PaymentProfile.name) private paymentProfileModel: Model<PaymentProfile>,
        private authNetService: AuthorizeNetService,
    ) { }

    // ─── ONE-TIME RAW CARD PAYMENT ─────────────────────────────────────────────
    async chargeOneTime(dto: OneTimePaymentDto, userId: string): Promise<Transaction> {
        try {
            const cleanedExp = dto.cardDetails.expirationDate.replace('/', '');
            const response = await this.authNetService.chargeRawCard(
                { ...dto.cardDetails, expirationDate: cleanedExp },
                dto.amount,
                dto.immediateCapture !== false,
            );

            const txResponseCode = response.responseCode;
            const isSuccess = txResponseCode === '1';

            let responseText = 'No message provided';
            if (response.messages?.message?.length > 0) {
                responseText = response.messages.message[0].description;
            }

            const transaction = new this.transactionModel({
                userId,                // ← track the logged-in user directly
                authorizeNetTransactionId: response.transId,
                amount: dto.amount,
                type: dto.immediateCapture === false ? TransactionType.AUTHORIZE : TransactionType.CHARGE,
                status: isSuccess ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
                responseCode: txResponseCode,
                responseText,
                rawResponse: JSON.parse(JSON.stringify(response)),
            });

            return transaction.save();
        } catch (error) {
            console.error('One-Time Payment Error:', error);
            if (error instanceof BadRequestException) throw error;
            throw new BadRequestException(error.message || 'One-time payment failed');
        }
    }

    // ─── ONE-TIME OPAQUE DATA PAYMENT (ACCEPT.JS) ──────────────────────────────
    async chargeOpaque(dto: OneTimeOpaquePaymentDto, userId: string): Promise<Transaction> {
        try {
            const response = await this.authNetService.chargeOpaqueToken(
                dto.opaqueData,
                dto.amount,
                dto.immediateCapture !== false,
            );

            const txResponseCode = response.responseCode;
            const isSuccess = txResponseCode === '1';

            let responseText = 'No message provided';
            if (response.messages?.message?.length > 0) {
                responseText = response.messages.message[0].description;
            }

            const transaction = new this.transactionModel({
                userId,
                authorizeNetTransactionId: response.transId,
                amount: dto.amount,
                type: dto.immediateCapture === false ? TransactionType.AUTHORIZE : TransactionType.CHARGE,
                status: isSuccess ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
                responseCode: txResponseCode,
                responseText,
                rawResponse: JSON.parse(JSON.stringify(response)),
            });

            return transaction.save();
        } catch (error) {
            console.error('Opaque Payment Error:', error);
            if (error instanceof BadRequestException) throw error;
            throw new BadRequestException(error.message || 'Opaque payment failed');
        }
    }

    // ─── CIM STORED-CARD PAYMENT ───────────────────────────────────────────────
    async chargeProfile(dto: ChargeProfileDto, userId: string): Promise<Transaction> {
        try {
            if (!dto.customerId || dto.customerId.length !== 24) {
                throw new BadRequestException('Invalid customerId format');
            }
            if (!dto.paymentProfileId || dto.paymentProfileId.length !== 24) {
                throw new BadRequestException('Invalid paymentProfileId format');
            }
            const customer = await this.customerModel.findById(dto.customerId);
            const paymentProfile = await this.paymentProfileModel.findById(dto.paymentProfileId);

            if (!customer || !paymentProfile) {
                throw new NotFoundException('Customer or Payment Profile not found');
            }

            const response = await this.authNetService.chargeCustomerProfile(
                customer.authorizeNetCustomerId,
                paymentProfile.authorizeNetPaymentProfileId,
                dto.amount,
                dto.immediateCapture !== false,
            );

            const txResponseCode = response.responseCode;
            const isSuccess = txResponseCode === '1';

            let responseText = 'No message provided';
            if (response.messages?.message?.length > 0) {
                responseText = response.messages.message[0].description;
            }

            const transaction = new this.transactionModel({
                userId,                // ← track the logged-in user directly
                customerId: dto.customerId,
                authorizeNetTransactionId: response.transId,
                amount: dto.amount,
                type: dto.immediateCapture === false ? TransactionType.AUTHORIZE : TransactionType.CHARGE,
                status: isSuccess ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
                responseCode: txResponseCode,
                responseText,
                rawResponse: JSON.parse(JSON.stringify(response)),
            });

            return transaction.save();
        } catch (error) {
            console.error('CIM Payment Error:', error);
            if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
            throw new BadRequestException(error.message || 'Payment processing failed');
        }
    }

    async capture(transactionId: string, user: any, amount?: number): Promise<Transaction> {
        try {
            if (!transactionId || transactionId.length !== 24) {
                throw new BadRequestException('Invalid Transaction ID format. Please provide the 24-character MongoDB _id.');
            }

            const originalTx = await this.transactionModel.findById(transactionId);
            if (!originalTx) {
                throw new NotFoundException('Transaction not found');
            }

            // Guard: Ensure we are only capturing an AUTHORIZE transaction
            if (originalTx.type !== TransactionType.AUTHORIZE) {
                throw new BadRequestException(
                    `Cannot capture a transaction with type '${originalTx.type}'. ` +
                    `You can only capture transactions that were created with 'immediateCapture: false'.`
                );
            }

            // Ownership check
            if (user && user.role !== 'admin') {
                // For one-time payments userId is stored directly; for CIM go through customer
                const directOwner = originalTx.userId && originalTx.userId.toString() === user.userId?.toString();
                const customer = originalTx.customerId ? await this.customerModel.findById(originalTx.customerId) : null;
                const cimOwner = customer && customer.userId && customer.userId.toString() === user.userId?.toString();
                if (!directOwner && !cimOwner) {
                    throw new ForbiddenException('You do not have permission to capture this transaction');
                }
            }

            // Use original amount if none provided
            const finalAmount = amount || originalTx.amount;

            if (finalAmount <= 0) {
                throw new BadRequestException('Amount must be a positive number');
            }

            const response = await this.authNetService.captureTransaction(
                originalTx.authorizeNetTransactionId,
                finalAmount,
            );

            // Create a new record for the capture event
            const captureTx = new this.transactionModel({
                customerId: originalTx.customerId,
                authorizeNetTransactionId: response.transId,
                amount: finalAmount,
                type: TransactionType.CAPTURE,
                status: TransactionStatus.SUCCESS,
                rawResponse: response,
            });

            return captureTx.save();
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new BadRequestException(`Capture failed: ${error.message}`);
        }
    }

    async refund(dto: RefundDto, user: any): Promise<Refund> {
        try {
            if (!dto.transactionId || dto.transactionId.length !== 24) {
                throw new BadRequestException('Invalid transactionId format');
            }
            const tx = await this.transactionModel.findById(dto.transactionId);
            if (!tx) throw new NotFoundException('Transaction not found');

            // Ownership check
            if (user.role !== 'admin') {
                const directOwner = tx.userId && tx.userId.toString() === user.userId?.toString();
                const customer = tx.customerId ? await this.customerModel.findById(tx.customerId) : null;
                const cimOwner = customer && customer.userId && customer.userId.toString() === user.userId?.toString();
                if (!directOwner && !cimOwner) {
                    throw new ForbiddenException('You do not have permission to refund this transaction');
                }
            }

            let cardInfo = {
                cardType: dto.cardType,
                last4: dto.last4,
                expirationDate: dto.expirationDate?.replace('/', ''),
            };

            // Attempt to get card info from payment profile if customerId and payment ID were used (CIM flow)
            if (!cardInfo.last4 || !cardInfo.expirationDate) {
                const paymentProfile = await this.paymentProfileModel.findOne({ customerId: tx.customerId, isDefault: true });
                if (paymentProfile) {
                    cardInfo.cardType = cardInfo.cardType || paymentProfile.cardType;
                    cardInfo.last4 = cardInfo.last4 || paymentProfile.last4;
                    cardInfo.expirationDate = cardInfo.expirationDate || paymentProfile.expirationDate;
                }
            }

            // Fallback: Extract last4 and cardType from rawResponse of the original transaction
            if (!cardInfo.last4 && tx.rawResponse?.accountNumber) {
                cardInfo.last4 = tx.rawResponse.accountNumber.replace(/X/g, '');
            }
            if (!cardInfo.cardType && tx.rawResponse?.accountType) {
                cardInfo.cardType = tx.rawResponse.accountType;
            }

            // Validation: Authorize.net NEEDS these for a refund
            if (!cardInfo.last4 || !cardInfo.expirationDate) {
                throw new BadRequestException(
                    'To refund this transaction, you must provide the expirationDate (MMYY). ' +
                    'The last4 digits were ' + (cardInfo.last4 ? 'found' : 'not found') + '.'
                );
            }

            console.log(`Attempting refund for transId: ${tx.authorizeNetTransactionId}, amount: ${dto.amount}`);

            const response = await this.authNetService.refundTransaction(
                tx.authorizeNetTransactionId,
                dto.amount,
                {
                    cardType: cardInfo.cardType || 'Visa',
                    last4: cardInfo.last4,
                    expirationDate: cardInfo.expirationDate,
                },
            );

            const refund = new this.refundModel({
                originalTransactionId: tx._id,
                authorizeNetRefundTransactionId: response.transId,
                amount: dto.amount,
                reason: dto.reason,
            });

            tx.status = TransactionStatus.REFUNDED;
            await tx.save();

            return refund.save();
        } catch (error) {
            console.error('Refund Method Error:', error);
            if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new BadRequestException(`Refund failed: ${error.message}`);
        }
    }

    async void(transactionId: string, user: any): Promise<Transaction> {
        try {
            if (!transactionId || transactionId.length !== 24) {
                throw new BadRequestException('Invalid transactionId format');
            }
            const tx = await this.transactionModel.findById(transactionId);
            if (!tx) throw new NotFoundException('Transaction not found');

            // Prevent voiding if already processed
            if (tx.status === TransactionStatus.VOIDED) {
                throw new BadRequestException('Transaction is already voided');
            }
            if (tx.status === TransactionStatus.REFUNDED) {
                throw new BadRequestException('Cannot void a refunded transaction. Use refund instead.');
            }

            // Ownership check
            if (user.role !== 'admin') {
                const directOwner = tx.userId && tx.userId.toString() === user.userId?.toString();
                const customer = tx.customerId ? await this.customerModel.findById(tx.customerId) : null;
                const cimOwner = customer && customer.userId && customer.userId.toString() === user.userId?.toString();
                if (!directOwner && !cimOwner) {
                    throw new ForbiddenException('You do not have permission to void this transaction');
                }
            }

            console.log(`Attempting to void transaction: ${tx.authorizeNetTransactionId} (Type: ${tx.type})`);

            const response = await this.authNetService.voidTransaction(tx.authorizeNetTransactionId);

            tx.status = TransactionStatus.VOIDED;
            tx.responseText = 'Transaction voided successfully';
            tx.rawResponse = JSON.parse(JSON.stringify(response));

            console.log(`Void successful for transaction: ${tx.authorizeNetTransactionId}`);
            return tx.save();
        } catch (error) {
            console.error('Void Method Error:', error);
            if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new BadRequestException(`Void failed: ${error.message}. Note: You can only void transactions that have not yet settled (usually within 24 hours).`);
        }
    }

    async findAllByUser(userId: string): Promise<Transaction[]> {
        if (!userId || userId.length !== 24) {
            return []; // Return empty if invalid ID format instead of crashing
        }
        const customers = await this.customerModel.find({ userId }).select('_id');
        const customerIds = customers.map(c => c._id);

        // Return both: one-time payments (userId match) and CIM payments (customerId match)
        return this.transactionModel.find({
            $or: [
                { userId },
                { customerId: { $in: customerIds } },
            ],
        } as any).sort({ createdAt: -1 }).exec();
    }
}
