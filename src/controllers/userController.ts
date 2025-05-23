// src/controllers/userController.ts
import { Request, Response } from 'express';
import db from '../db/knex';
import { User, UserDTO } from '../models/userModel';

// Local toUserDTO helper function
const toUserDTO = (user: User): UserDTO => {
  const { password, ...rest } = user; // eslint-disable-line @typescript-eslint/no-unused-vars
  const userDto: UserDTO = {
    id: rest.id,
    email: rest.email,
    role: rest.role,
    createdAt: rest.createdAt,
    updatedAt: rest.updatedAt,
  };
  if (rest.name !== undefined) {
    userDto.name = rest.name;
  }
  return userDto;
};

// Internal Knex-based function to get user by ID
const getUserByIdForProfile = async (id: number): Promise<User | null> => {
  const user = await db('users').where({ id }).first();
  return user || null;
};

export const getCurrentUserProfile = async (
  req: Request & { user?: any }, // req.user is expected from auth middleware
  res: Response,
): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      // This should ideally be caught by auth middleware,
      // but as a safeguard in controller:
      res.status(401).json({ message: 'Not authenticated or user ID missing from token' });
      return;
    }

    const userId = req.user.userId;
    const user = await getUserByIdForProfile(userId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const userDto = toUserDTO(user);
    res.status(200).json(userDto);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error retrieving user profile' });
  }
};
