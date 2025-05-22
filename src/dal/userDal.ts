import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/db';
import { User, UserCreationAttributes, UserDTO } from '../models/User';
import { hashPassword } from '../utils/auth';

// Create a new user
export const createUser = async (userDto: UserCreationAttributes): Promise<User> => {
  try {
    // Hash the password before storing
    const hashedPassword = await hashPassword(userDto.password);
    
    const query = `
      INSERT INTO users (email, password, role)
      VALUES (?, ?, ?)
    `;
    
    const [result] = await pool.execute<ResultSetHeader>(
      query,
      [userDto.email, hashedPassword, userDto.role]
    );
    
    const userId = result.insertId;
    return getUserById(userId);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (id: number): Promise<User | null> => {
  try {
    const query = `
      SELECT * FROM users
      WHERE id = ?
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0] as User;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

// Get user by email (for authentication)
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const query = `
      SELECT * FROM users
      WHERE email = ?
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, [email]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0] as User;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

// Get all users (for admin purposes)
export const getAllUsers = async (): Promise<UserDTO[]> => {
  try {
    const query = `
      SELECT id, email, role, createdAt, updatedAt FROM users
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query);
    
    return rows as UserDTO[];
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Check if email exists (for registration validation)
export const emailExists = async (email: string): Promise<boolean> => {
  try {
    const query = `
      SELECT COUNT(*) as count FROM users
      WHERE email = ?
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, [email]);
    
    return (rows[0] as { count: number }).count > 0;
  } catch (error) {
    console.error('Error checking if email exists:', error);
    throw error;
  }
};

// Convert User to UserDTO (remove password)
export const toUserDTO = (user: User): UserDTO => {
  const { password, ...userDTO } = user;
  return userDTO as UserDTO;
};