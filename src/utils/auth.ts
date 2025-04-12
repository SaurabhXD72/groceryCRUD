import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET = 'secret-key-bla-bla';


export const hashPassword = (password: string) => {
    return bcrypt.hashSync(password, 15);
};

export const comparePassword = (password: string, hash: string) => {
    return bcrypt.compareSync(password, hash);
};

export const generateToken = (userId: number, role: string) => {
    return jwt.sign({userId, role }, SECRET, {expiresIn: '1h'});
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, SECRET);
};