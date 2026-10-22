/**
 * Gemini AI service — handles all GenAI interactions.
 * Prompt templates are hardcoded; user input is clearly delineated
 * to prevent prompt injection.
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured. Set it in .env.local');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/** Safety settings — block medium and above */
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export interface EventContext {
  type: string;
  title: string;
  eventDate: string;
  totalBudget: number;
  guestCount?: number;
  theme?: string;
  location?: string;
  notes?: string;
}

/**
 * Generate a full event plan (budget breakdown + milestones + vendor categories + ideas).
 */
export async function generateEventPlan(event: EventContext): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings,
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
  });

  const systemPrompt = `You are an expert event planner AI assistant. Generate a comprehensive event plan in JSON format.

RESPOND ONLY WITH VALID JSON (no markdown, no code fences). Use this exact schema:
{
  "budgetBreakdown": [{ "category": "string", "amount": number, "percentage": number, "tips": "string" }],
  "milestones": [{ "title": "string", "description": "string", "daysBeforeEvent": number, "priority": "HIGH|MEDIUM|LOW" }],
  "vendorCategories": [{ "category": "string", "priority": "ESSENTIAL|RECOMMENDED|OPTIONAL", "budgetRange": "string" }],
  "themeIdeas": ["string"],
  "tips": ["string"]
}`;

  const userPrompt = `EVENT DETAILS:
- Type: ${event.type}
- Title: ${event.title}
- Date: ${event.eventDate}
- Budget: $${event.totalBudget}
- Guest Count: ${event.guestCount ?? 'Not specified'}
- Theme: ${event.theme ?? 'Not specified'}
- Location: ${event.location ?? 'Not specified'}
- Notes: ${event.notes ?? 'None'}`;

  const result = await model.generateContent([systemPrompt, userPrompt]);
  return result.response.text();
}

/**
 * Suggest creative ideas for an event.
 */
export async function suggestIdeas(event: EventContext, category: string): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  });

  const systemPrompt = `You are a creative event planner. Suggest 5-8 unique, personalized ideas for the "${category}" aspect of this event. Return as a JSON array of objects: [{ "idea": "string", "description": "string", "estimatedCost": "string" }]`;

  const userPrompt = `Event: ${event.type} — "${event.title}"
Budget: $${event.totalBudget}, Guests: ${event.guestCount ?? '?'}, Theme: ${event.theme ?? 'open'}`;

  const result = await model.generateContent([systemPrompt, userPrompt]);
  return result.response.text();
}

/**
 * Budget optimization suggestions.
 */
export async function optimizeBudget(event: EventContext, currentItems: Array<{ category: string; estimated: number }>): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings,
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
  });

  const systemPrompt = `You are a budget optimization expert. Analyze the current budget and suggest ways to save money without sacrificing quality. Return JSON: { "savings": [{ "category": "string", "suggestion": "string", "potentialSaving": number }], "totalPotentialSaving": number }`;

  const userPrompt = `Event: ${event.type}, Total Budget: $${event.totalBudget}
Current allocations: ${JSON.stringify(currentItems)}`;

  const result = await model.generateContent([systemPrompt, userPrompt]);
  return result.response.text();
}

/**
 * Recommend vendor categories that are relevant for the event.
 */
export async function recommendVendors(event: EventContext): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings,
    generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
  });

  const systemPrompt = `You are an event operations specialist. Recommend vendor categories for the event. Return JSON only with this schema: { "vendors": [{ "category": "string", "priority": "ESSENTIAL|RECOMMENDED|OPTIONAL", "notes": "string", "suggestedBudgetRange": "string" }] }`;

  const userPrompt = `Event type: ${event.type}\nBudget: $${event.totalBudget}\nGuest count: ${event.guestCount ?? 'unknown'}\nTheme: ${event.theme ?? 'not set'}\nLocation: ${event.location ?? 'not set'}`;

  const result = await model.generateContent([systemPrompt, userPrompt]);
  return result.response.text();
}

/**
 * General AI chat for event-specific questions.
 */
export async function chatWithAI(event: EventContext, message: string): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings,
    generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
  });

  const systemPrompt = `You are a helpful event planning assistant. You are helping plan a ${event.type} event titled "${event.title}" on ${event.eventDate} with a budget of $${event.totalBudget} for ${event.guestCount ?? 'an unspecified number of'} guests. Theme: ${event.theme ?? 'not decided'}. Give practical, actionable advice. Be concise.`;

  const result = await model.generateContent([systemPrompt, `User question: ${message}`]);
  return result.response.text();
}
