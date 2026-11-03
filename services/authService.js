import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import Session from '../models/SessionModel.js';

const scrypt = promisify(scryptCallback);
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = await scrypt(password, salt, 64);
    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password, storedPassword) {
    if (!storedPassword?.startsWith('scrypt$')) {
        return password === storedPassword;
    }

    const [, salt, keyHex] = storedPassword.split('$');
    if (!salt || !keyHex) return false;
    const expected = Buffer.from(keyHex, 'hex');
    const actual = await scrypt(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function issueSession(userId) {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await Session.create({ userId, tokenHash, expiresAt });
    return { token, expiresAt };
}

export function hashSessionToken(token) {
    return createHash('sha256').update(token).digest('hex');
}

export function publicUser(user) {
    return {
        _id: user._id,
        name: user.name,
        dob: user.dob,
        phone: user.phone,
        email: user.email,
        username: user.username,
        role: user.role,
        budgetLimit: user.budgetLimit,
        salary: user.salary ?? 0
    };
}
