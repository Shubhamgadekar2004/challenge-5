import { afterEach, describe, expect, it } from 'vitest';
import { getRequiredEnv, validateServerEnv } from '@/lib/env';

describe('environment validation', () => {
  const original = process.env.TEST_REQUIRED_ENV;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.TEST_REQUIRED_ENV;
    } else {
      process.env.TEST_REQUIRED_ENV = original;
    }
  });

  it('returns the configured value for required environment variables', () => {
    process.env.TEST_REQUIRED_ENV = 'configured';
    expect(getRequiredEnv('TEST_REQUIRED_ENV')).toBe('configured');
  });

  it('throws when a required environment variable is missing', () => {
    delete process.env.TEST_REQUIRED_ENV;
    expect(() => getRequiredEnv('TEST_REQUIRED_ENV')).toThrow('Missing required environment variable');
  });

  it('collects all missing variable names for the server bootstrap check', () => {
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_URL;
    expect(() => validateServerEnv(['NEXTAUTH_SECRET', 'NEXTAUTH_URL'])).toThrow(/NEXTAUTH_SECRET|NEXTAUTH_URL/);
  });
});
