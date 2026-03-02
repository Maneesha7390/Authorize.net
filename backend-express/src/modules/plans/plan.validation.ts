import Joi from "joi";

export const createPlanSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    amount: Joi.number().required().min(0),
    intervalLength: Joi.number().required().min(1),
    intervalUnit: Joi.string().valid("months", "days", "weeks", "years").required(),
    totalOccurrences: Joi.number().optional().min(1),
    trialAmount: Joi.number().optional().min(0),
    trialOccurrences: Joi.number().optional().min(0),
    isActive: Joi.boolean().optional(),
});

export const updatePlanSchema = Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    amount: Joi.number().optional().min(0),
    intervalLength: Joi.number().optional().min(1),
    intervalUnit: Joi.string().valid("months", "days", "weeks", "years").optional(),
    totalOccurrences: Joi.number().optional().min(1),
    trialAmount: Joi.number().optional().min(0),
    trialOccurrences: Joi.number().optional().min(0),
    isActive: Joi.boolean().optional(),
});
