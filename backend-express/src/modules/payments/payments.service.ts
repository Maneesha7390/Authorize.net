import { Transaction, TransactionStatus, TransactionType } from "../subscriptions/transaction.model";
import { Refund } from "../subscriptions/refund.model";
import { Customer } from "../customers/customer.model";
import { PaymentProfile } from "../customers/payment-profile.model";
import { Subscription } from "../subscriptions/subscription.model";
import { authNetService } from "../../common/AuthorizeNetService";
import { ApiError } from "../../utils/ApiError";
import { config } from "../../config";

export class PaymentsService {
    static async chargeOneTime(dto: any, userId: string) {
        const cleanedExp = dto.cardDetails.expirationDate.replace("/", "");
        try {
            const response = await authNetService.chargeRawCard(
                { ...dto.cardDetails, expirationDate: cleanedExp },
                dto.amount,
                dto.immediateCapture !== false
            );

            const isSuccess = response.responseCode === "1";
            const responseText = response.messages?.message?.[0]?.description || "No message provided";

            const transaction = await Transaction.create({
                userId,
                authorizeNetTransactionId: response.transId,
                amount: dto.amount,
                type: dto.immediateCapture === false ? TransactionType.AUTHORIZE : TransactionType.CHARGE,
                status: isSuccess ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
                responseText,
                rawResponse: response,
            });

            return transaction;
        } catch (error: any) {
            throw new ApiError(400, error.message || "One-time payment failed");
        }
    }

    static async chargeOpaque(dto: any, userId: string) {
        try {
            const response = await authNetService.chargeOpaqueToken(
                dto.opaqueData,
                dto.amount,
                dto.immediateCapture !== false
            );

            const isSuccess = response.responseCode === "1";
            const responseText = response.messages?.message?.[0]?.description || "No message provided";

            const transaction = await Transaction.create({
                userId,
                authorizeNetTransactionId: response.transId,
                amount: dto.amount,
                type: dto.immediateCapture === false ? TransactionType.AUTHORIZE : TransactionType.CHARGE,
                status: isSuccess ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
                responseText,
                rawResponse: response,
            });

            return transaction;
        } catch (error: any) {
            throw new ApiError(400, error.message || "Opaque payment failed");
        }
    }

    static async chargeProfile(dto: any, userId: string) {
        const customer = await Customer.findById(dto.customerId);
        const paymentProfile = await PaymentProfile.findById(dto.paymentProfileId);

        if (!customer || !paymentProfile) {
            throw new ApiError(404, "Customer or Payment Profile not found");
        }

        try {
            const response = await authNetService.chargeCustomerProfile(
                customer.authorizeNetCustomerId,
                paymentProfile.authorizeNetPaymentProfileId,
                dto.amount,
                dto.immediateCapture !== false
            );

            const isSuccess = response.responseCode === "1";
            const responseText = response.messages?.message?.[0]?.description || "No message provided";

            const transaction = await Transaction.create({
                userId,
                customerId: dto.customerId,
                authorizeNetTransactionId: response.transId,
                amount: dto.amount,
                type: dto.immediateCapture === false ? TransactionType.AUTHORIZE : TransactionType.CHARGE,
                status: isSuccess ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
                responseText,
                rawResponse: response,
            });

            return transaction;
        } catch (error: any) {
            throw new ApiError(400, error.message || "Profile charge failed");
        }
    }

    static async capture(id: string, user: any, amount?: number) {
        const originalTx = await Transaction.findById(id);
        if (!originalTx) throw new ApiError(404, "Transaction not found");

        if (originalTx.type !== TransactionType.AUTHORIZE) {
            throw new ApiError(400, "Only AUTHORIZE transactions can be captured");
        }

        // Ownership check
        if (user.role !== "admin") {
            const isOwner = originalTx.userId?.toString() === user._id.toString();
            if (!isOwner) throw new ApiError(403, "Access denied");
        }

        const finalAmount = amount || originalTx.amount;

        if (!originalTx.authorizeNetTransactionId) {
            throw new ApiError(400, "Transaction does not have a gateway ID for capture");
        }

        try {
            const response = await authNetService.captureTransaction(
                originalTx.authorizeNetTransactionId as string,
                finalAmount
            );

            return await Transaction.create({
                customerId: originalTx.customerId,
                authorizeNetTransactionId: response.transId,
                amount: finalAmount,
                type: TransactionType.CAPTURE,
                status: TransactionStatus.SUCCESS,
                rawResponse: response,
            });
        } catch (error: any) {
            throw new ApiError(400, `Capture failed: ${error.message}`);
        }
    }

    static async refund(dto: any, user: any) {
        const tx = await Transaction.findById(dto.transactionId);
        if (!tx) throw new ApiError(404, "Transaction not found");

        // Ownership check
        if (user.role !== "admin") {
            const isOwner = tx.userId?.toString() === user._id.toString();
            if (!isOwner) throw new ApiError(403, "Access denied");
        }

        // Card info logic
        let cardInfo: any = {
            last4: dto.last4,
            expirationDate: dto.expirationDate?.replace("/", ""),
        };

        if (!cardInfo.last4 || !cardInfo.expirationDate) {
            // Try to find from sub/profile as in NestJS
            if (tx.subscriptionId) {
                const sub = await Subscription.findById(tx.subscriptionId);
                if (sub?.paymentProfileId) {
                    const profile = await PaymentProfile.findById(sub.paymentProfileId);
                    if (profile) {
                        cardInfo.last4 = cardInfo.last4 || profile.last4;
                        cardInfo.expirationDate = cardInfo.expirationDate || profile.expirationDate;
                    }
                }
            }
        }

        if (!cardInfo.last4 || !cardInfo.expirationDate) {
            throw new ApiError(400, "Missing last4 or expirationDate for refund");
        }

        if (!tx.authorizeNetTransactionId) {
            throw new ApiError(400, "Transaction does not have a gateway ID for refund");
        }

        try {
            const response = await authNetService.refundTransaction(
                tx.authorizeNetTransactionId as string,
                dto.amount,
                cardInfo
            );

            const refund = await Refund.create({
                originalTransactionId: tx._id,
                authorizeNetRefundTransactionId: response.transId,
                amount: dto.amount,
                reason: dto.reason,
            });

            tx.status = TransactionStatus.REFUNDED;
            await tx.save();

            return refund;
        } catch (error: any) {
            throw new ApiError(400, `Refund failed: ${error.message}`);
        }
    }

    static async void(id: string, user: any) {
        const tx = await Transaction.findById(id);
        if (!tx) throw new ApiError(404, "Transaction not found");

        if (user.role !== "admin" && tx.userId?.toString() !== user._id.toString()) {
            throw new ApiError(403, "Access denied");
        }

        if (!tx.authorizeNetTransactionId) {
            throw new ApiError(400, "Transaction does not have a gateway ID for void");
        }

        try {
            await authNetService.voidTransaction(tx.authorizeNetTransactionId as string);
            tx.status = TransactionStatus.VOIDED;
            await tx.save();
            return tx;
        } catch (error: any) {
            throw new ApiError(400, `Void failed: ${error.message}`);
        }
    }

    static async findAllByUser(userId: string) {
        const customers = await Customer.find({ userId }).select("_id");
        const customerIds = customers.map((c) => c._id);

        return await Transaction.find({
            $or: [{ userId }, { customerId: { $in: customerIds } }],
        }).sort({ createdAt: -1 });
    }

    static async createHostedPayment(dto: any, userId: string) {
        const pendingTx = await Transaction.create({
            userId,
            amount: dto.amount,
            type: dto.immediateCapture ? TransactionType.CHARGE : TransactionType.AUTHORIZE,
            status: TransactionStatus.PENDING,
            responseText: "Hosted Payment Attempt",
            authorizeNetTransactionId: "PENDING_HOSTED_" + Date.now(),
        });

        const returnUrl = dto.returnUrl || process.env.PAYMENT_SUCCESS_URL || "https://example.com/success";
        const cancelUrl = dto.cancelUrl || process.env.PAYMENT_CANCEL_URL || "https://example.com/cancel";
        const transactionType = dto.immediateCapture !== false ? "authCaptureTransaction" : "authOnlyTransaction";

        try {
            const token = await authNetService.createHostedPaymentPage(
                dto.amount,
                returnUrl,
                cancelUrl,
                transactionType,
                pendingTx._id.toString()
            );
            return { token };
        } catch (error: any) {
            throw new ApiError(400, `Hosted payment failed: ${error.message}`);
        }
    }

    static async getCustomerCards(userId: string) {
        const customer = await Customer.findOne({ userId });
        if (!customer) throw new ApiError(404, "Customer profile not found");
        // This requires getCustomerPaymentProfiles in AuthorizeNetService which I should add back if deleted
        return await authNetService.getCustomerPaymentProfiles(customer.authorizeNetCustomerId);
    }
}
