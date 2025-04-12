import {Request, Response } from 'express';
import db from '../db/knex';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';

export const register = async (req: Request, res: Response): Promise<Response> => {
    const { name, email, password, role } = req.body;
    const hashedPassword = hashPassword(password);

try {
    const[userId] = await db('users').insert({
        name,
        email,
        password: hashedPassword,
        role: role || 'user'
    });
    const token = generateToken(userId, role || 'user');
    return res.json({token});
} catch (error) {
    return res.status(400).json({error:"Email already exists!"});
}
};

export const login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body;
    const user = await db('users').where({ email }).first();
    
    if (!user || !comparePassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user.id, user.role);
    return res.json({ token });
  };