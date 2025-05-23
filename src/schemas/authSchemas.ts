import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(['admin', 'customer']).optional(), // Default will be handled in controller/service
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"), // Basic check, actual password check is against db
});
