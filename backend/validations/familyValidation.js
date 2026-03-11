import Joi from "joi";

export const familySchema = Joi.object({

  name: Joi.string()
    .min(2)
    .max(50)
    .required(),

  description: Joi.string()
    .allow("")
    .optional(),

  groups: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(1)
    .required()

});