// src/dal/userDal.ts
import db from '../db/knex'; // Import Knex instance
import { User, UserCreationAttributes, UserDTO } from '../models/User';
import { hashPassword } from '../utils/auth';

// Create a new user
export const createUser = async (
  userDto: UserCreationAttributes,
): Promise<User> => {
  try {
    // Hash the password before storing
    const hashedPassword = await hashPassword(userDto.password);

    const [userId] = await db('users').insert({
      email: userDto.email,
      password: hashedPassword,
      role: userDto.role,
    });

    // Knex insert with MariaDB/MySQL returns the insertId directly.
    return getUserById(userId);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (id: number): Promise<User | null> => {
  try {
    const user = await db('users').where({ id }).first();
    return user || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

// Get user by email (for authentication)
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const user = await db('users').where({ email }).first();
    return user || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

// Get all users (for admin purposes)
export const getAllUsers = async (): Promise<UserDTO[]> => {
  try {
    const users = await db('users').select(
      'id',
      'email',
      'role',
      'createdAt',
      'updatedAt',
    );
    return users as UserDTO[]; // Passwords are not selected
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Check if email exists (for registration validation)
export const emailExists = async (email: string): Promise<boolean> => {
  try {
    const result = await db('users').where({ email }).count({ count: '*' }).first();
    return (result?.count || 0) > 0;
  } catch (error) {
    console.error('Error checking if email exists:', error);
    throw error;
  }
};

// Convert User to UserDTO (remove password)
// This function does not involve DB operations, so it remains unchanged.
export const toUserDTO = (user: User): UserDTO => {
  const { password, ...userDTO } = user;
  return userDTO as UserDTO;
};
