import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = 'secret-key-bla-bla';

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('🚨 No token provided');
      res.status(401).json({ error: 'Access denied' });
      return;
    }

    try {
      const decoded = jwt.verify(token, SECRET) as { role: string };
      console.log('🔑 Decoded Token Role:', decoded.role);
      console.log('🛡️ Required Roles:', roles);
      
      if (!roles.includes(decoded.role)) {
        console.log('⛔ Role mismatch!');
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      
      console.log('✅ Access granted');
      next();
    } catch (err) {
      console.log('💥 Token verification failed:', err);
      res.status(401).json({ error: 'Invalid token' });
    }
  };
};