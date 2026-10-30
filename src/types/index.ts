/**
 * @file Shared TypeScript type definitions for the Celebration & Event Planner.
 * Centralizes all domain types used across API routes and UI components.
 * @module types
 */

import type { EVENT_TYPES, EVENT_STATUSES, BUDGET_STATUSES, VENDOR_STATUSES } from '@/lib/constants';

/* ---------- NextAuth Module Augmentation ---------- */

declare module 'next-auth' {
  /** Augmented session to include the user's database ID. */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  /** Augmented JWT to carry the user's database ID. */
  interface JWT {
    sub?: string;
  }
}

/* ---------- Domain Enums (string-union equivalents) ---------- */

/** Supported event types. */
export type EventType = (typeof EVENT_TYPES)[number];

/** Lifecycle status of an event. */
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** Payment status of a single budget line-item. */
export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

/** Pipeline status of a vendor. */
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

/* ---------- Domain Models ---------- */

/** Core event record returned by the API. */
export interface EventRecord {
  id: string;
  title: string;
  type: EventType;
  totalBudget: number;
  eventDate: string;
  location?: string | null;
  guestCount?: number | null;
  theme?: string | null;
  notes?: string | null;
  status: EventStatus;
  createdAt?: string;
  updatedAt?: string;
  budgetItems: BudgetItem[];
  milestones: Milestone[];
  vendors: Vendor[];
}

/** Summary event used in list views (omits relations). */
export interface EventSummary {
  id: string;
  title: string;
  type: EventType;
  totalBudget: number;
  eventDate: string;
  status: EventStatus;
  guestCount?: number | null;
  location?: string | null;
  theme?: string | null;
  createdAt?: string;
}

/** A single budget line-item. */
export interface BudgetItem {
  id: string;
  category: string;
  description?: string | null;
  estimated?: number | null;
  actual?: number | null;
  status: BudgetStatus;
}

/** A timeline milestone. */
export interface Milestone {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  completed: boolean;
  sortOrder?: number | null;
}

/** A vendor entry in the checklist. */
export interface Vendor {
  id: string;
  name: string;
  category: string;
  contact?: string | null;
  email?: string | null;
  quotedPrice?: number | null;
  status: VendorStatus;
  notes?: string | null;
}

/* ---------- AI Types ---------- */

/** A single message in the AI chat. */
export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

/** AI-generated event plan structure. */
export interface AIEventPlan {
  budgetBreakdown: Array<{ category: string; amount: number; percentage: number; tips: string }>;
  milestones: Array<{ title: string; description: string; daysBeforeEvent: number; priority: 'HIGH' | 'MEDIUM' | 'LOW' }>;
  vendorCategories: Array<{ category: string; priority: 'ESSENTIAL' | 'RECOMMENDED' | 'OPTIONAL'; budgetRange: string }>;
  themeIdeas: string[];
  tips: string[];
}

/** AI budget optimization result. */
export interface BudgetOptimization {
  savings: Array<{ category: string; suggestion: string; potentialSaving: number }>;
  totalPotentialSaving: number;
}

/** AI vendor recommendation result. */
export interface VendorRecommendations {
  vendors: Array<{
    category: string;
    priority: 'ESSENTIAL' | 'RECOMMENDED' | 'OPTIONAL';
    notes: string;
    suggestedBudgetRange: string;
  }>;
}

/** AI idea suggestion. */
export interface IdeaSuggestion {
  idea: string;
  description: string;
  estimatedCost: string;
}
