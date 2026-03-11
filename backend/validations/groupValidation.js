import Joi from "joi";

export const groupSchema = Joi.object({

  name: Joi.string()
    .min(2)
    .max(50)
    .required(),

  description: Joi.string()
    .allow("")
    .optional(),

  tags: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(1)
    .required()

});