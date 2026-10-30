/**
 * Input sanitization helpers.
 * Prevents XSS by stripping HTML tags and dangerous characters.
 */

const collapseWhitespace = (input: string): string => input.replace(/\s+/g, ' ').trim();

/**
 * Strip HTML, encoded entities, and control characters from a string.
 */
export function stripHtml(input: string): string {
  if (typeof input !== 'string') return '';

  return collapseWhitespace(
    input
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#0*160;/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[#\w]+;/g, ' ')
      .replace(/[\u0000-\u001F\u007F]+/g, ' ')
  );
}

/**
 * Sanitize user input — strip HTML, normalize whitespace, enforce max length.
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  return stripHtml(input).slice(0, maxLength);
}

/**
 * Normalize an email address for storage and comparison.
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase().replace(/\s+/g, '').slice(0, 254);
}

export function normalizeEmail(email: string): string {
  return sanitizeEmail(email);
}

/**
 * Sanitize a number input — returns NaN if invalid.
 */
export function sanitizeNumber(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return NaN;
  return num;
}
