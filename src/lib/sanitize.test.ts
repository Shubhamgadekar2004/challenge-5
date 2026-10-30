import { describe, expect, it } from 'vitest';
import { sanitizeEmail, sanitizeInput, stripHtml } from './sanitize';

describe('sanitizeInput', () => {
  it('strips markup and collapses whitespace while preserving text', () => {
    expect(sanitizeInput('  <b>Wedding</b>  &nbsp; plans  ')).toBe('Wedding plans');
  });

  it('removes script tags and dangerous content', () => {
    expect(stripHtml('<script>alert(1)</script><p>Hello</p>')).toBe('Hello');
  });

  it('normalizes email addresses for auth', () => {
    expect(sanitizeEmail('  USER@Example.COM  ')).toBe('user@example.com');
  });
});
