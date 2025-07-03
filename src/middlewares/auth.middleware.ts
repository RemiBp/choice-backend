import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repositories';

interface AuthenticatedRequest extends Request {
  userId?: number;
}

interface UserPayload extends JwtPayload {
  id: number;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_ACCESS_SECRET!, (err, user) => {
      if (err || !user) {
        return res.sendStatus(401);
      }

      if (typeof user !== 'string' && 'id' in user) {
        const payload = user as UserPayload;
        const producerRoles = ['restaurant', 'leisure', 'wellness'];
        if (!producerRoles.includes(payload.role.name)) {
          return res.status(401).json({ message: 'User is not a producer' });
        }
        req.userId = payload.id;
        next();
      } else {
        res.sendStatus(401);
      }
    });
  } else {
    res.sendStatus(401);
  }
};

export const checkStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
