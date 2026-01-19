import bcrypt from 'bcrypt';

/**
 * Hash password using the same algorithm as Better Auth
 * Better Auth uses bcrypt with 10 salt rounds by default
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
