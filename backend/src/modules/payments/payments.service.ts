import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionStatus, TransactionType } from '../../schemas/transaction.schema';
import { Refund } from '../../schemas/refund.schema';
import { Customer } from '../../schemas/customer.schema';
import { PaymentProfile } from '../../schemas/payment-profile.schema';
import { AuthorizeNetService } from '../../common/authorize-net.service';
import { ChargeProfileDto } from './dto/charge-profile.dto';
import { RefundDto } from './dto/refund.dto';
@Injectable()
export class PaymentsService {
    constructor(
        @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
        @InjectModel(Refund.name) private refundModel: Model<Refund>,
        @InjectModel(Customer.name) private customerModel: Model<Customer>,
        @InjectModel(PaymentProfile.name) private paymentProfileModel: Model<PaymentProfile>,
        private authNetService: AuthorizeNetService,
    ) { }

    async chargeProfile(dto: ChargeProfileDto): Promise<Transaction> {
        try {
            const customer = await this.customerModel.findById(dto.customerId);
            const paymentProfile = await this.paymentProfileModel.findById(dto.paymentProfileId);

            if (!customer || !paymentProfile) {
                throw new NotFoundException('Customer or Payment Profile not found');
            }

            // 1. Authorize transaction in Authorize.Net
            const response = await this.authNetService.chargeCustomerProfile(
                customer.authorizeNetCustomerId,
                paymentProfile.authorizeNetPaymentProfileId,
                dto.amount,
                dto.immediateCapture !== false, // Default to true if not provided
            );

            const txResponseCode = response.responseCode;
            const isSuccess = txResponseCode === '1';

            // Get message safely
            let responseText = 'No message provided';
            if (response.messages && response.messages.message && response.messages.message.length > 0) {
                responseText = response.messages.message[0].description;
            }

            // 2. Save transaction in MongoDB
            const transaction = new this.transactionModel({
                customerId: customer._id,
                authorizeNetTransactionId: response.transId,
                amount: dto.amount,
                type: TransactionType.CHARGE,
                status: isSuccess ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
                responseCode: txResponseCode,
                responseText: responseText,
                rawResponse: JSON.parse(JSON.stringify(response)), // Ensure it's a plain object for Mongoose
            });

            return transaction.save();
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new BadRequestException(error.message || 'Payment processing failed');
        }
    }

    async capture(transactionId: string, user: any, amount?: number): Promise<Transaction> {
        try {
            if (!transactionId || transactionId.length !== 24) {
                throw new BadRequestException('Invalid Transaction ID format. Please provide the 24-character MongoDB _id.');
            }

            const originalTx = await this.transactionModel.findById(transactionId);
            if (!originalTx) throw new NotFoundException('Transaction not found');

            // Ownership check (Added)
            if (user && user.role !== 'admin') {
                const customer = await this.customerModel.findById(originalTx.customerId);
                if (!customer || customer.userId?.toString() !== user.userId?.toString()) {
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
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Capture failed: ${error.message}`);
        }
    }

    async refund(dto: RefundDto, user: any): Promise<Refund> {
        const tx = await this.transactionModel.findById(dto.transactionId);
        if (!tx) throw new NotFoundException('Transaction not found');

        // Ownership check
        if (user.role !== 'admin') {
            const customer = await this.customerModel.findById(tx.customerId);
            if (!customer || customer.userId?.toString() !== user.userId?.toString()) {
                throw new ForbiddenException('You do not have permission to refund this transaction');
            }
        }

        const paymentProfile = await this.paymentProfileModel.findOne({ customerId: tx.customerId, isDefault: true }); // Simplified for demo
        if (!paymentProfile) throw new BadRequestException('Payment profile not found for refund');

        const response = await this.authNetService.refundTransaction(
            tx.authorizeNetTransactionId,
            dto.amount,
            {
                cardType: paymentProfile.cardType,
                last4: paymentProfile.last4,
                expirationDate: paymentProfile.expirationDate,
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
    }

    async void(transactionId: string, user: any): Promise<Transaction> {
        const tx = await this.transactionModel.findById(transactionId);
        if (!tx) throw new NotFoundException('Transaction not found');

        // Ownership check
        if (user.role !== 'admin') {
            const customer = await this.customerModel.findById(tx.customerId);
            if (!customer || customer.userId?.toString() !== user.userId?.toString()) {
                throw new ForbiddenException('You do not have permission to void this transaction');
            }
        }

        const response = await this.authNetService.voidTransaction(tx.authorizeNetTransactionId);

        tx.status = TransactionStatus.VOIDED;
        tx.rawResponse = JSON.parse(JSON.stringify(response));
        return tx.save();
    }
}
