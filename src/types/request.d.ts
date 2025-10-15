import { Request } from 'express';
import { RoleName } from '../enums/Producer.enum';

declare global {
  namespace Express {
    interface Request {
      userId: number;
      roleName: string;
      blockedUserIds?: number[];
    }
  }
}

export { };