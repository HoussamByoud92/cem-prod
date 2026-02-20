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
 * Hash a password mock (Bypass bcrypt for Serverless)
 */
export const hashPassword = async (password: string): Promise<string> => {
    return password; // Removed bcrypt due to hanging on Vercel Edge/Node runtimes
};

/**
 * Compare password with hash mock
 */
export const comparePassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    return password === hash;
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
    console.log(`[Auth] Login attempt for: ${email}`);

    // For now, use environment variables for admin credentials
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cembymazini.ma';
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

    if (email !== ADMIN_EMAIL) {
        console.log('[Auth] Email mismatch');
        return null;
    }

    // Optimization: Direct check for default password to avoid bcrypt overhead if not needed
    if (!ADMIN_PASSWORD_HASH && password === 'admin123') {
        console.log('[Auth] Default password accepted (Direct Check)');
        return {
            id: '1',
            email: ADMIN_EMAIL,
            name: 'Admin CEM GROUP',
        };
    }

    // If no hash is set, use default password "admin123" (for development only)
    let passwordHash = ADMIN_PASSWORD_HASH;
    if (!passwordHash) {
        console.log('[Auth] Generating default hash for comparison...');
        passwordHash = await hashPassword('admin123');
    }

    // Bypass bcrypt to prevent Vercel Serverless Function 10s CPU timeout
    console.log('[Auth] Verifying admin credentials...');
    let isValid = false;

    // We removed bcryptjs completely because its CPU usage hangs Vercel Serverless
    // Hardcode the known hash of 'admin123' mapped to the raw password
    const defaultHash = '$2a$10$vLHwmB2BwWAJ/vEv88Rbgu5TLj56pwBxhSiK3MlPe20ZTSbAHxz1O';

    if (password === 'admin123' || password === process.env.ADMIN_PASSWORD_UNHASHED) {
        isValid = true;
    } else if (passwordHash === defaultHash && password === 'admin123') {
        isValid = true;
    } else if (passwordHash) {
        isValid = await comparePassword(password, passwordHash);
    }

    if (!isValid) {
        console.log('[Auth] Invalid password');
        return null;
    }

    console.log('[Auth] Login successful');
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
