import Joi from "joi";

export const createSubscriptionSchema = Joi.object({
    customerId: Joi.string().required().length(24),
    planId: Joi.string().required().length(24),
    paymentProfileId: Joi.string().required().length(24),
    planName: Joi.string().optional(),
    amount: Joi.number().optional(),
    startDate: Joi.string().isoDate().optional(),
    intervalLength: Joi.number().optional().min(1),
    intervalUnit: Joi.string().valid("months", "days", "weeks", "years").optional(),
    totalOccurrences: Joi.number().optional().min(1),
    trialAmount: Joi.number().optional().min(0),
    trialOccurrences: Joi.number().optional().min(0),
});

export const upgradeSubscriptionSchema = Joi.object({
    newPlanId: Joi.string().required().length(24),
    newAmount: Joi.number().optional().min(0),
});
