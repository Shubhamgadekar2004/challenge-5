/**
 * Input sanitization helpers.
 * Prevents XSS by stripping HTML tags and dangerous characters.
 */

/**
 * Strip all HTML tags from a string.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize user input — strip HTML, trim, enforce max length.
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  return stripHtml(input).trim().slice(0, maxLength);
}

/**
 * Sanitize an email address.
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().slice(0, 254);
}

/**
 * Sanitize a number input — returns NaN if invalid.
 */
export function sanitizeNumber(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return NaN;
  return num;
}
