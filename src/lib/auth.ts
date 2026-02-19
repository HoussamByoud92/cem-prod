import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cem-group-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d'; // 7 days

export interface AdminUser {
    id: string;
    email: string;
    name: string;
}

export interface TokenPayload {
    userId: string;
    email: string;
    name: string;
}

/**
 * Hash a password
 */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 */
export const generateToken = (user: AdminUser): string => {
    const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        name: user.name,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        return null;
    }
};

/**
 * Simple admin authentication
 * In production, you should use a proper user management system
 */
export const authenticateAdmin = async (
    email: string,
    password: string
): Promise<AdminUser | null> => {
    // For now, use environment variables for admin credentials
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cembymazini.ma';
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

    if (email !== ADMIN_EMAIL) {
        return null;
    }

    // If no hash is set, use default password "admin123" (for development only)
    const defaultHash = await hashPassword('admin123');
    const passwordHash = ADMIN_PASSWORD_HASH || defaultHash;

    const isValid = await comparePassword(password, passwordHash);
    if (!isValid) {
        return null;
    }

    return {
        id: '1',
        email: ADMIN_EMAIL,
        name: 'Admin CEM GROUP',
    };
};

/**
 * Middleware to check if user is authenticated
 */
export const requireAuth = async (authHeader: string | undefined): Promise<TokenPayload | null> => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);
    return verifyToken(token);
};
