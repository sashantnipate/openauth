/**
 * Basic pattern verification enforcing common corporate and consumer email criteria rules.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // Clean text wrappers before performing syntax execution checks
  const sanitized = email.trim();
  if (sanitized.length > 320) return false; // Prevent extreme ReDoS string buffer overflows
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(sanitized);
}

/**
 * Structural validator ensuring minimal user record mutations do not execute with broken empty spaces.
 */
export function validateRegistrationInput(input: { email?: string; name?: string; password?: string }) {
  if (!input.email || !isValidEmail(input.email)) {
    throw new Error("A valid email address is required.");
  }
  
  if (!input.name || typeof input.name !== 'string' || input.name.trim().length < 2) {
    throw new Error("Display name details must be at least 2 characters long.");
  }
  
  // Enforce minimal security rules for standard password-based signups
  if (input.password !== undefined && input.password.length < 8) {
    throw new Error("Password credentials must contain a minimum of 8 characters.");
  }
}