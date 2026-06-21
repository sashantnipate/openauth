/**
 * Ensures a value is present.
 */
export function requireValue(
  value: unknown,
  field: string
): void {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    throw new Error(`${field} is required.`);
  }
}

/**
 * Validates an email address.
 */
export function validateEmail(email: string): void {
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error("Invalid email address.");
  }
}

/**
 * Validates a password.
 */
export function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new Error(
      "Password must be at least 8 characters long."
    );
  }
}

/**
 * Validates a user's name.
 */
export function validateName(name: string): void {
  if (name.trim().length < 2) {
    throw new Error(
      "Name must contain at least 2 characters."
    );
  }
}