import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * Generates a signed JWT using HS256.
 */
export function generateToken(
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: jwt.SignOptions["expiresIn"]
): string {
  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn,
  });
}

/**
 * Verifies and decodes an inbound JWT signature context safely.
 */
export function verifyToken<T extends JwtPayload = JwtPayload>(
  token: string,
  secret: string
): T | null {
  try {
    return jwt.verify(token, secret) as T;
  } catch {
    return null;
  }
}

/**
 * Decodes a JWT payload without verifying its signature.
 * Use only when payload attributes are needed instantly without strict integrity validations.
 */
export function decodeToken<T extends JwtPayload = JwtPayload>(token: string): T | null {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === "string") {
    return null;
  }
  return decoded as T;
}