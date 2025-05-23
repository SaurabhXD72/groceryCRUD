// src/controllers/authController.ts
import { Request, Response } from 'express';
import db from '../db/knex'; // Import Knex instance
import { User, UserCreationAttributes, UserDTO } from '../models/userModel'; 
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { RegisterInput, LoginInput } from '../schemas/authSchemas';

// --- Internal Knex-based functions ---

// Utility function to convert User to UserDTO
const toUserDTO = (user: User): UserDTO => {
  // Ensure all fields including 'name' are correctly mapped
  const { password, ...rest } = user; // eslint-disable-line @typescript-eslint/no-unused-vars
  const userDto: UserDTO = { 
    id: rest.id, 
    email: rest.email, 
    role: rest.role, 
    createdAt: rest.createdAt, 
    updatedAt: rest.updatedAt,
    name: rest.name, // Directly map name; if rest.name is undefined, userDto.name will be undefined
  };
  // No conditional needed now, as undefined is a valid value for an optional field.
  return userDto;
};

// createUser now expects UserCreationAttributes which includes hashed password and optional name
const createUser = async (
  userDto: UserCreationAttributes, 
): Promise<User> => {
  const userToInsert: Partial<User> = { // Use Partial<User> for building the object
    email: userDto.email,
    password: userDto.password, // Expecting hashed password here
    role: userDto.role,
  };

  if (userDto.name) {
    userToInsert.name = userDto.name;
  }

  const [userId] = await db('users').insert(userToInsert);
  
  const newUser = await db('users').where({ id: userId }).first();
  if (!newUser) {
    throw new Error('Failed to retrieve user immediately after creation.');
  }
  return newUser as User;
};

const getUserByEmail = async (email: string): Promise<User | null> => {
  const user = await db('users').where({ email }).first();
  return user || null;
};

const emailExists = async (email: string): Promise<boolean> => {
  const result = await db('users').where({ email }).count({ count: '*' }).first() as { count: number | string } | undefined;
  // Ensure count is treated as a number
  const count = result?.count ? parseInt(String(result.count), 10) : 0;
  return count > 0;
};

// --- Controller methods ---

export const register = async (
  req: Request<any, any, RegisterInput>,
  res: Response,
): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    const exists = await emailExists(email);
    if (exists) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    const finalRole = role || 'customer';
    const hashedPassword = await hashPassword(password); // Hash password before calling createUser
    
    const newUser = await createUser({ 
      email, 
      password: hashedPassword, // Pass hashed password
      name, 
      role: finalRole 
    });

    // createUser throws if retrieval fails, so newUser should be valid User object here
    const token = generateToken(newUser); 
    const userDtoResult = toUserDTO(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      user: userDtoResult,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error && error.message.includes('Failed to retrieve user')) {
        res.status(500).json({ message: 'Error creating user: Internal data retrieval error.' });
    } else {
        res.status(500).json({ message: 'Error registering user' });
    }
  }
};

// Login user
export const login = async (
  req: Request<any, any, LoginInput>,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user);
    const userDtoResult = toUserDTO(user);

    res.status(200).json({
      message: 'Login successful',
      user: userDtoResult,
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

    const user = await getUserByEmail(req.user.email); // Assuming email is in token payload
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const userDtoResult = toUserDTO(user);
    res.status(200).json({
      user: userDtoResult,
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ message: 'Error retrieving user profile' });
  }
};
