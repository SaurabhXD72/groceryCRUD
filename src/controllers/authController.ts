// src/controllers/authController.ts
import { Request, Response } from 'express';
import { createUser, getUserByEmail, emailExists, toUserDTO } from '../dal/userDal';
import { verifyPassword, generateToken } from '../utils/auth';
import { UserCreationAttributes } from '../models/User';

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body as UserCreationAttributes;

    // Input validation
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    // Password strength validation
    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters long' });
      return;
    }

    // Check if email exists
    const exists = await emailExists(email);
    if (exists) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    // Use default role as 'customer' if not provided or invalid
    const validRole = role === 'admin' ? 'admin' : 'customer';

    // Create user
    const newUser = await createUser({ email, password, role: validRole });
    
    // Generate token
    const token = generateToken(newUser);
    
    // Return user data without password
    const userDto = toUserDTO(newUser);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userDto,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }
    
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
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
};

// Get current user profile
export const getCurrentUser = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    const { userId } = req.user;
    
    // Get user from database to get the most up-to-date information
    const user = await getUserByEmail(req.user.email);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Return user data without password
    const userDto = toUserDTO(user);
    
    res.status(200).json({
      user: userDto
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ message: 'Error retrieving user profile' });
  }
};