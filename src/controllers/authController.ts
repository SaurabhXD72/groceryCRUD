// src/controllers/authController.ts
import { Request, Response } from 'express';
import {
  createUser,
  getUserByEmail,
  emailExists,
  toUserDTO,
} from '../dal/userDal';
import { verifyPassword, generateToken } from '../utils/auth';
// UserCreationAttributes is no longer strictly needed here for body type
// import { UserCreationAttributes } from '../models/User';
import { RegisterInput, LoginInput } from '../schemas/authSchemas'; // Zod inferred types

// Register a new user
export const register = async (
  req: Request<any, any, RegisterInput>, // Use Zod inferred type for body
  res: Response,
): Promise<void> => {
  try {
    const { email, password, role } = req.body; // Already validated by Zod

    // Check if email exists (business logic, not input validation)
    const exists = await emailExists(email);
    if (exists) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    // Use default role as 'customer' if not provided
    const validRole = role || 'customer';

    // Create user
    const newUser = await createUser({ email, password, role: validRole });

    // Generate token
    const token = generateToken(newUser);

    // Return user data without password
    const userDto = toUserDTO(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      user: userDto,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

// Login user
export const login = async (
  req: Request<any, any, LoginInput>, // Use Zod inferred type for body
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body; // Already validated by Zod

    // Get user by email
    const user = await getUserByEmail(email);

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = generateToken(user);

    // Return user data without password
    const userDto = toUserDTO(user);

    res.status(200).json({
      message: 'Login successful',
      user: userDto,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
};

// Get current user profile
export const getCurrentUser = async (
  req: Request & { user?: any },
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    // Get user from database to get the most up-to-date information
    // req.user comes from token, which should contain email or id
    const user = await getUserByEmail(req.user.email); // Assuming email is in token

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Return user data without password
    const userDto = toUserDTO(user);

    res.status(200).json({
      user: userDto,
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ message: 'Error retrieving user profile' });
  }
};

// Example of how routes should be updated (in authRoutes.ts, not here):
// router.post('/register', validateRequestBody(registerSchema), register);
// router.post('/login', validateRequestBody(loginSchema), login);
