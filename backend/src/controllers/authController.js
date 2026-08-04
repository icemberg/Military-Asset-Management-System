import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { ValidationError, AuthenticationError } from '../utils/errors.js';

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      throw new ValidationError('Username and password are required');
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, baseId: user.baseId },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, role: user.role, baseId: user.baseId });
  } catch (error) {
    next(error);
  }
};
