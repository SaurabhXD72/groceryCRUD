import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be a positive number"),
  image_url: z.string().url("Must be a valid URL").optional(),
  // Fields like brand, model, stockQuantity, specifications, imageUrls (plural) are removed
  // as per the simplified requirement for this specific API.
  // createdBy will be added from authenticated user.
});

export const updateProductSchema = z.object({
  name: z.string().min(1, "Name cannot be empty if provided").optional(),
  brand: z.string().min(1, "Brand cannot be empty if provided").optional(),
  model: z.string().min(1, "Model cannot be empty if provided").optional(),
  description: z.string().optional(),
  price: z.number().positive("Price must be a positive number").optional(),
  stockQuantity: z.number().int().nonnegative("Stock quantity must be a non-negative integer").optional(),
  specifications: z.object({}).catchall(z.any()).optional(),
  imageUrls: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'deleted']).optional() // Added status for updates
});

export const productFilterSchema = z.object({
  createdBy: z.string().transform((val, ctx) => {
    const parsed = parseInt(val);
    if (isNaN(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "createdBy must be a positive integer string",
      });
      return z.NEVER;
    }
    return parsed;
  }).optional(),
  adminEmail: z.string().email("Invalid email format for adminEmail").optional(),
  brand: z.string().optional(),
  status: z.enum(['active', 'inactive', 'deleted']).optional(),
  minPrice: z.string().transform((val, ctx) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "minPrice must be a non-negative number string",
      });
      return z.NEVER;
    }
    return parsed;
  }).optional(),
  maxPrice: z.string().transform((val, ctx) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "maxPrice must be a non-negative number string",
      });
      return z.NEVER;
    }
    return parsed;
  }).optional(),
}).refine(data => data.minPrice === undefined || data.maxPrice === undefined || data.minPrice <= data.maxPrice, {
  message: "minPrice cannot be greater than maxPrice",
  path: ["minPrice", "maxPrice"], // Path to highlight both fields in error
});

// Export inferred types
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
