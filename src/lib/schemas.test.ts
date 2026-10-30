import { describe, expect, it } from 'vitest';
import { aiChatSchema, createBudgetItemSchema, createEventSchema, createVendorSchema } from '@/lib/schemas';

describe('schemas', () => {
  it('accepts a valid event payload', () => {
    const parsed = createEventSchema.safeParse({
      title: 'Summer Picnic',
      type: 'COMMUNITY',
      totalBudget: 2500,
      eventDate: '2027-06-12',
      location: 'Riverside Park',
      guestCount: 120,
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects invalid vendor email values', () => {
    const parsed = createVendorSchema.safeParse({
      name: 'Catering Co',
      category: 'Food',
      email: 'not-an-email',
    });

    expect(parsed.success).toBe(false);
  });

  it('validates AI chat messages and budget amounts', () => {
    expect(aiChatSchema.safeParse({ message: 'Plan the timeline' }).success).toBe(true);
    expect(aiChatSchema.safeParse({ message: '' }).success).toBe(false);
    expect(createBudgetItemSchema.safeParse({ category: 'Venue', estimated: 1000, actual: 1200 }).success).toBe(true);
  });
});
