/** Minimum password length for signup and password reset. */
export const MIN_PASSWORD_LENGTH = 8;

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one letter and one number.";
  }

  return null;
}

export function passwordHint(): string {
  return `At least ${MIN_PASSWORD_LENGTH} characters, with a letter and a number`;
}
