import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

const createValidationMiddleware = (
  schema: AnyZodObject,
  target: 'body' | 'params' | 'query'
) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dataToValidate = req[target];
    req[target] = await schema.parseAsync(dataToValidate);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // Prettify Zod errors to be more user-friendly
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      res.status(400).json({ message: "Validation failed", errors: formattedErrors });
    } else {
      // Log the unexpected error for server-side inspection
      console.error(`Unexpected error during ${target} validation:`, error);
      res.status(500).json({ message: `Internal server error during ${target} validation` });
    }
  }
};

export const validateRequestBody = (schema: AnyZodObject) => 
  createValidationMiddleware(schema, 'body');

export const validateRequestParams = (schema: AnyZodObject) => 
  createValidationMiddleware(schema, 'params');

export const validateRequestQuery = (schema: AnyZodObject) => 
  createValidationMiddleware(schema, 'query');
