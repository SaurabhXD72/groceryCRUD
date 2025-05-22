import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().refine(val => /^\d+$/.test(val), {
    message: "ID must be a numeric string"
  }).transform(Number).refine(val => Number.isInteger(val) && val > 0, {
    message: "ID must be a positive integer"
  })
});
