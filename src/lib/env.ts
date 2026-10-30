/**
 * @file Environment configuration helpers.
 * Centralizes validation needed before the app boots.
 */

/**
 * Returns a required environment variable or throws a clear error.
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Validates a set of required environment variables and returns the resolved values.
 */
export function validateServerEnv(requiredNames: string[] = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GEMINI_API_KEY',
]): Record<string, string> {
  const missing = requiredNames.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return requiredNames.reduce((acc, name) => {
    acc[name] = process.env[name] as string;
    return acc;
  }, {} as Record<string, string>);
}
