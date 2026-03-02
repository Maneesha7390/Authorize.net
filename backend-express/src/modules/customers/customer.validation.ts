import Joi from "joi";

export const addCardSchema = Joi.object({
    cardNumber: Joi.string().required().min(13).max(16).messages({
        "any.required": "Card number is required",
        "string.min": "Invalid card number length",
        "string.max": "Invalid card number length",
    }),
    expirationDate: Joi.string()
        .required()
        .regex(/^(0[1-9]|1[0-2])\/\d{2}$/)
        .messages({
            "any.required": "Expiration date is required",
            "string.pattern.base": "Invalid expiration date format. Expected MM/YY",
        }),
    cardCode: Joi.string().required().min(3).max(4).messages({
        "any.required": "Card code (CVV) is required",
    }),
    cardType: Joi.string().optional(),
});
