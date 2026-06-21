import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt);

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

/**
 * Hashes a plain text password using scrypt.
 *
 * The returned value contains both the generated salt and
 * the derived key in the following format:
 *
 * salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString("hex");

  const derivedKey = (await scrypt(
    password,
    salt,
    KEY_LENGTH
  )) as Buffer;

  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plain text password against a stored password hash.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  const [salt, storedHash] = passwordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const derivedKey = (await scrypt(
    password,
    salt,
    KEY_LENGTH
  )) as Buffer;

  const storedBuffer = Buffer.from(storedHash, "hex");

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedKey);
}