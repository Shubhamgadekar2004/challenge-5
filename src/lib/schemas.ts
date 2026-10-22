/**
 * Zod validation schemas for all API inputs.
 * Ensures type safety and prevents injection attacks.
 */
import { z } from 'zod';

/* ---------- Event Schemas ---------- */
export const EVENT_TYPES = ['WEDDING', 'BIRTHDAY', 'COMMUNITY'] as const;
export const EVENT_STATUSES = ['PLANNING', 'IN_PROGRESS', 'COMPLETED'] as const;

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  type: z.enum(EVENT_TYPES),
  totalBudget: z.number().positive('Budget must be positive').max(10_000_000),
  eventDate: z.string().min(1, 'Event date is required'),
  location: z.string().max(500).optional(),
  guestCount: z.number().int().positive().max(100_000).optional(),
  theme: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(EVENT_STATUSES).optional(),
});

/* ---------- Budget Schemas ---------- */
export const BUDGET_STATUSES = ['PENDING', 'PAID', 'OVERBUDGET'] as const;

export const createBudgetItemSchema = z.object({
  category: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  estimated: z.number().min(0).max(10_000_000).optional(),
  actual: z.number().min(0).max(10_000_000).optional(),
  status: z.enum(BUDGET_STATUSES).optional(),
});

export const updateBudgetItemSchema = createBudgetItemSchema.partial();

/* ---------- Timeline / Milestone Schemas ---------- */
export const createMilestoneSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().optional(),
  completed: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateMilestoneSchema = createMilestoneSchema.partial();

/* ---------- Vendor Schemas ---------- */
export const VENDOR_STATUSES = ['RESEARCHING', 'CONTACTED', 'BOOKED', 'CONFIRMED', 'CANCELLED'] as const;

export const createVendorSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  contact: z.string().max(200).optional(),
  email: z.string().email().max(254).optional(),
  quotedPrice: z.number().min(0).max(10_000_000).optional(),
  status: z.enum(VENDOR_STATUSES).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

/* ---------- AI Schemas ---------- */
export const aiChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
});

export const aiSuggestSchema = z.object({
  category: z.string().min(1).max(100),
});
