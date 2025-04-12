import { User } from '../models/user'; // Optional: If you have a User type

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
      };
    }
  }
}