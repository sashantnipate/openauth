import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * Generates a signed JWT.
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
 * Verifies and decodes a JWT.
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
 * Decodes a JWT without verifying its signature.
 *
 * This should only be used when the payload is needed
 * without validating the token.
 */
export function decodeToken<T extends JwtPayload = JwtPayload>(
  token: string
): T | null {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded === "string") {
    return null;
  }

  return decoded as T;
}