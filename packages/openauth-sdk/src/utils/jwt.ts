import jwt from 'jsonwebtoken';

/**
 * Generates an encrypted authorization session string mapped against a target configuration duration.
 */
export function generateSessionToken(payload: { userId: string }, secret: string, duration: string): string {
  return jwt.sign(payload, secret, {
    expiresIn: duration as any,
  });
}

/**
 * Decodes cryptographic context payloads safely without throwing unhandled exceptions up the stack.
 */
export function decodeSessionToken(token: string, secret: string): { userId: string } | null {
  try {
    return jwt.verify(token, secret) as { userId: string };
  } catch (error) {
    // Gracefully catch standard token expirations and signature tampering errors
    return null;
  }
}