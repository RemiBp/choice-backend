import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repositories';

interface UserPayload extends JwtPayload {
  id: number;
}

export const authenticateJWTForRestaurant = (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  if (accessToken) {
    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!, (err, user) => {
      if (err || !user) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      if (typeof user !== 'string' && 'id' in user) {
        const payload = user as UserPayload;
        if (payload.role.id !== 3) {
          res.status(401).json({ message: 'User is not a restaurant' });
        }
        req.userId = payload.id;
        next();
      } else {
        res.status(401).json({ message: 'Invalid token' });
      }
    });
  } else {
    res.status(401).json({ message: 'token is missing in header' });
  }
};

export const checkStatus = async (req: Request, res: Response, next: NextFunction) => {
  if (req.userId) {
    const userId = req.userId;
    const user = await UserRepository.findOne({ where: { id: userId, isDeleted: false } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.isActive === false) {
      return res.status(401).json({ message: 'User is not active' });
    }
    next();
  } else {
    res.sendStatus(401);
  }
};
