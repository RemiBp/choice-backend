import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repositories';

// interface AuthenticatedRequest extends Request {
//     userId?: number;
//     roleName?: string;
// }

interface UserPayload extends JwtPayload {
    id: number;
    role: {
        id: number;
        name: string;
    };
}

export const authenticateJWTForBooking = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token missing in Authorization header' });
        }

        jwt.verify(token, process.env.JWT_ACCESS_SECRET!, (err, decoded) => {
            if (err || !decoded || typeof decoded === 'string') {
                return res.status(401).json({ message: 'Invalid or expired token' });
            }

            const payload = decoded as UserPayload;

            if (!payload.id || !payload.role?.name) {
                return res.status(400).json({ message: 'Token payload is missing required fields' });
            }

            req.userId = payload.id;
            req.roleName = payload.role.name;

            next();
        });
    } catch (error) {
        console.error('JWT Middleware Error:', error);
        return res.status(500).json({ message: 'Internal server error in auth middleware' });
    }
};

export const checkStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: 'User ID not found in request' });
        }

        const user = await UserRepository.findOne({
            where: { id: req.userId, isDeleted: false },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isActive) {
            return res.status(401).json({ message: 'User is not active' });
        }

        next();
    } catch (error) {
        console.error('Status Middleware Error:', error);
        return res.status(500).json({ message: 'Internal server error while checking user status' });
    }
};

export const checkPostCreationPermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const allowedRoles = ['user', 'restaurant', 'leisure', 'wellness'];
        const allowedRoles = ['user'];

        if (!req.roleName) {
            return res.status(403).json({ message: 'Role not found in request' });
        }

        if (!allowedRoles.includes(req.roleName)) {
            return res.status(403).json({ message: 'This role is not allowed to create posts' });
        }

        next();
    } catch (error) {
        console.error('Role Check Middleware Error:', error);
        return res.status(500).json({ message: 'Internal error in role check middleware' });
    }
};

export const validatePostTypeByRole = (req: Request, res: Response, next: NextFunction) => {
    const roleName = (req as any).roleName;
    const { type } = req.body;

    if (!roleName || !type) {
        return res.status(400).json({
            message: 'Missing role or post type in request.',
        });
    }

    const allowedRoles = ['restaurant', 'leisure', 'wellness'];

    if (!allowedRoles.includes(roleName)) {
        return res.status(403).json({
            message: `Role '${roleName}' is not allowed to create producer posts.`,
        });
    }

    if (roleName !== type) {
        return res.status(400).json({
            message: `Role '${roleName}' can only create '${roleName}' posts.`,
        });
    }

    next();
};
