// src/middleware/adminOnlyMiddleware.ts
import { Request, Response, NextFunction } from 'express';

// Define a more specific type for the user payload if available
// For now, using `any` for req.user as it's added by previous middleware
// and its exact type might depend on the JWT payload definition.
// Ideally, you'd have an interface like:
// interface AuthenticatedUser {
//   userId: number;
//   email: string;
//   role: 'admin' | 'customer';
//   iat?: number; // Issued at
//   exp?: number; // Expiration time
// }
// interface AuthenticatedRequest extends Request {
//   user?: AuthenticatedUser;
// }

export const adminOnlyMiddleware = (
  req: Request & { user?: any }, // Or use AuthenticatedRequest if defined
  res: Response,
  next: NextFunction,
): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admins only' });
  }
};
