/**
 * @file Application-wide constants.
 * Centralizes magic strings and configuration values used across API routes,
 * validation schemas, and UI components.
 * @module constants
 */

/* ---------- Event ---------- */

/** Supported event types. */
export const EVENT_TYPES = ['WEDDING', 'BIRTHDAY', 'COMMUNITY'] as const;

/** Lifecycle statuses for an event. */
export const EVENT_STATUSES = ['PLANNING', 'IN_PROGRESS', 'COMPLETED'] as const;

/** Human-readable labels for event types. */
export const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Wedding',
  BIRTHDAY: 'Birthday',
  COMMUNITY: 'Community',
} as const;

/** Emoji icons for event types. */
export const EVENT_TYPE_ICONS: Record<string, string> = {
  WEDDING: '💒',
  BIRTHDAY: '🎂',
  COMMUNITY: '🎪',
} as const;

/** CSS class for event status badges. */
export const STATUS_BADGE_CLASS: Record<string, string> = {
  PLANNING: 'badge-info',
  IN_PROGRESS: 'badge-warning',
  COMPLETED: 'badge-success',
} as const;

/* ---------- Budget ---------- */

/** Payment statuses for budget line-items. */
export const BUDGET_STATUSES = ['PENDING', 'PAID', 'OVERBUDGET'] as const;

/* ---------- Vendor ---------- */

/** Pipeline statuses for vendors. */
export const VENDOR_STATUSES = ['RESEARCHING', 'CONTACTED', 'BOOKED', 'CONFIRMED', 'CANCELLED'] as const;

/* ---------- Rate Limiting ---------- */

/** Maximum AI API requests per user per minute. */
export const RATE_LIMIT_MAX_TOKENS = 30;

/** Token refill rate (tokens per second). */
export const RATE_LIMIT_REFILL_RATE = 0.5;

/* ---------- Validation Limits ---------- */

/** Maximum character lengths for text fields. */
export const MAX_LENGTHS = {
  TITLE: 200,
  LOCATION: 500,
  THEME: 200,
  NOTES: 2000,
  DESCRIPTION: 1000,
  CATEGORY: 100,
  VENDOR_NAME: 200,
  EMAIL: 254,
  AI_MESSAGE: 2000,
} as const;

/** Maximum monetary amount for budget fields. */
export const MAX_BUDGET_AMOUNT = 10_000_000;

/** Maximum guest count. */
export const MAX_GUEST_COUNT = 100_000;

/* ---------- Bcrypt ---------- */

/** Salt rounds for bcrypt password hashing. */
export const BCRYPT_SALT_ROUNDS = 12;

/** Minimum password length for registration. */
export const MIN_PASSWORD_LENGTH = 6;
