import Joi from "joi";

export const chargeOneTimeSchema = Joi.object({
    amount: Joi.number().required().min(0.01),
    immediateCapture: Joi.boolean().default(true),
    cardDetails: Joi.object({
        cardNumber: Joi.string().required().creditCard(),
        expirationDate: Joi.string().required().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/),
        cardCode: Joi.string().required().min(3).max(4),
    }).required(),
});

export const chargeOpaqueSchema = Joi.object({
    amount: Joi.number().required().min(0.01),
    immediateCapture: Joi.boolean().default(true),
    opaqueData: Joi.object({
        dataDescriptor: Joi.string().required(),
        dataValue: Joi.string().required(),
    }).required(),
});

export const chargeProfileSchema = Joi.object({
    amount: Joi.number().required().min(0.01),
    customerId: Joi.string().required().length(24),
    paymentProfileId: Joi.string().required().length(24),
    immediateCapture: Joi.boolean().default(true),
});

export const refundSchema = Joi.object({
    transactionId: Joi.string().required().length(24),
    amount: Joi.number().required().min(0.01),
    reason: Joi.string().optional(),
    last4: Joi.string().optional().length(4),
    expirationDate: Joi.string().optional().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/),
});

export const hostedPaymentSchema = Joi.object({
    amount: Joi.number().required().min(0.01),
    immediateCapture: Joi.boolean().default(true),
    returnUrl: Joi.string().uri().optional(),
    cancelUrl: Joi.string().uri().optional(),
});

export const captureSchema = Joi.object({
    amount: Joi.number().optional().min(0.01),
});
