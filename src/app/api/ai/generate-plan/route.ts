import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { generateEventPlan } from '@/lib/gemini';
import { parseModelJson } from '@/lib/ai-json';

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!checkRateLimit(`${userId}:generate-plan`)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { eventId } = await req.json();
  if (!eventId || typeof eventId !== 'string') {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }

  const event = await prisma.event.findFirst({ where: { id: eventId, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const raw = await generateEventPlan({
      type: event.type,
      title: event.title,
      eventDate: event.eventDate.toISOString(),
      totalBudget: event.totalBudget,
      guestCount: event.guestCount ?? undefined,
      theme: event.theme ?? undefined,
      location: event.location ?? undefined,
      notes: event.notes ?? undefined,
    });

    const plan = parseModelJson<{
      budgetBreakdown: Array<{ category: string; amount: number; percentage: number; tips: string }>;
      milestones: Array<{ title: string; description: string; daysBeforeEvent: number; priority: string }>;
      vendorCategories: Array<{ category: string; priority: string; budgetRange: string }>;
      themeIdeas: string[];
      tips: string[];
    }>(raw);

    await prisma.aIConversation.create({
      data: {
        eventId: event.id,
        prompt: 'Generate full plan',
        response: JSON.stringify(plan),
        category: 'GENERATE_PLAN',
      },
    });

    return NextResponse.json({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
