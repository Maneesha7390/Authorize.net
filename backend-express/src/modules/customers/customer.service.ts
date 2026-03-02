import { Customer } from "./customer.model";
import { PaymentProfile } from "./payment-profile.model";
import { User } from "../auth/auth.model";
import { ApiError } from "../../utils/ApiError";
import { authNetService } from "../../common/AuthorizeNetService";

export class CustomersService {
    static async addCardAndSyncCustomer(dto: any, userId: string) {
        // 1. Fetch user details
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "Logged-in user not found");

        const emailParts = user.email.split("@")[0].split(".");
        const firstName = (user as any).firstName || emailParts[0] || "User";
        const lastName = (user as any).lastName || emailParts[1] || "User";

        // 2. Find or Create Customer in Authorize.Net + MongoDB
        let customer = await Customer.findOne({ userId });

        if (!customer) {
            let authNetId: string;
            try {
                authNetId = await authNetService.createCustomerProfile(
                    user.email,
                    firstName,
                    lastName
                );
            } catch (error: any) {
                if (error.code === "E00039") {
                    authNetId = (await authNetService.getCustomerProfileIdByEmail(
                        user.email
                    )) as string;
                    if (!authNetId) {
                        throw new ApiError(
                            400,
                            "Customer profile exists in Authorize.net but could not be retrieved."
                        );
                    }
                } else {
                    throw error;
                }
            }

            customer = await Customer.create({
                email: user.email,
                firstName,
                lastName,
                authorizeNetCustomerId: authNetId,
                userId,
            });
        }

        // 3. Add Payment Profile
        const [mm, yy] = dto.expirationDate.split("/");
        const cleanedExp = `20${yy}-${mm}`;

        let authNetPaymentId: string;
        try {
            authNetPaymentId = await authNetService.createPaymentProfile(
                customer.authorizeNetCustomerId,
                {
                    cardNumber: dto.cardNumber,
                    expirationDate: cleanedExp,
                    cardCode: dto.cardCode,
                },
                {
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                }
            );
        } catch (error: any) {
            if (error.code === "E00039") {
                const existingCard = await PaymentProfile.findOne({
                    customerId: customer._id as any,
                    last4: dto.cardNumber.slice(-4),
                });

                if (existingCard) {
                    return {
                        customerId: customer._id,
                        authorizeNetCustomerId: customer.authorizeNetCustomerId,
                        paymentProfileId: existingCard._id,
                        authorizeNetPaymentProfileId: existingCard.authorizeNetPaymentProfileId,
                        last4: existingCard.last4,
                        cardType: existingCard.cardType,
                        expirationDate: existingCard.expirationDate,
                        message: "Card already exists and is ready for use",
                    };
                } else {
                    throw new ApiError(
                        409,
                        "This card is already registered in Authorize.net for this customer. Please contact support to sync."
                    );
                }
            }
            throw error;
        }

        const paymentProfile = await PaymentProfile.create({
            customerId: customer._id,
            authorizeNetPaymentProfileId: authNetPaymentId,
            cardType: dto.cardType,
            last4: dto.cardNumber.slice(-4),
            expirationDate: dto.expirationDate,
        });

        return {
            customerId: customer._id,
            authorizeNetCustomerId: customer.authorizeNetCustomerId,
            paymentProfileId: paymentProfile._id,
            authorizeNetPaymentProfileId: paymentProfile.authorizeNetPaymentProfileId,
            last4: paymentProfile.last4,
            cardType: paymentProfile.cardType,
            expirationDate: paymentProfile.expirationDate,
            message: "Customer and card ready for subscription",
        };
    }

    static async getCardsByUserId(userId: string) {
        const customer = await Customer.findOne({ userId });
        if (!customer) return [];

        return await PaymentProfile.find({ customerId: customer._id });
    }
}
