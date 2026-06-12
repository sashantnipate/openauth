import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

/**
 * Generates a secure scrypt password hash accompanied by a unique 16-byte salt string.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Validates inbound credentials using timingSafeEqual to defeat side-channel attack loops.
 */
export async function verifyPassword(password: string, storedValue: string): Promise<boolean> {
  const [salt, originalHash] = storedValue.split(':');
  if (!salt || !originalHash) {
    return false;
  }
  
  const currentHashBuffer = (await scryptAsync(password, salt, 64)) as Buffer;
  const originalHashBuffer = Buffer.from(originalHash, 'hex');
  
  // Guard lengths strictly before passing buffers to avoid byte-length boundary mismatched crashes
  if (currentHashBuffer.length !== originalHashBuffer.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(currentHashBuffer, originalHashBuffer);
}