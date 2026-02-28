import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: string;
            };
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Access token required' });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            res.status(403).json({ message: 'Invalid or expired token' });
            return;
        }
        req.user = user;
        next();
    });
};

import fs from 'fs';
export const authorizeRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const logMsg = `[authorizeRole] URL: ${req.originalUrl}, User role: ${req.user?.role}, Allowed roles: ${roles}\n`;
        fs.appendFileSync('auth_debug.log', logMsg);

        if (!req.user) {
            fs.appendFileSync('auth_debug.log', `REJECTED no user\n`);
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            fs.appendFileSync('auth_debug.log', `[authorizeRole] REJECTED. User ${req.user.userId} has role ${req.user.role}\n`);
            res.status(403).json({ message: 'Access denied: Insufficient permissions' });
            return;
        }

        next();
    };
};
