import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { optimizeBudget } from '@/lib/gemini';
import { parseModelJson } from '@/lib/ai-json';

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!checkRateLimit(`${userId}:budget-optimize`)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { eventId } = await req.json();
  if (!eventId || typeof eventId !== 'string') {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }

  const event = await prisma.event.findFirst({ where: { id: eventId, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const items = await prisma.budgetItem.findMany({
    where: { eventId: event.id },
    select: { category: true, estimated: true },
  });

  try {
    const raw = await optimizeBudget(
      {
        type: event.type,
        title: event.title,
        eventDate: event.eventDate.toISOString(),
        totalBudget: event.totalBudget,
        guestCount: event.guestCount ?? undefined,
        theme: event.theme ?? undefined,
        location: event.location ?? undefined,
        notes: event.notes ?? undefined,
      },
      items.map((item) => ({ category: item.category, estimated: item.estimated ?? 0 }))
    );

    const optimization = parseModelJson<{
      savings: Array<{ category: string; suggestion: string; potentialSaving: number }>;
      totalPotentialSaving: number;
    }>(raw);

    await prisma.aIConversation.create({
      data: {
        eventId: event.id,
        prompt: 'Optimize budget',
        response: JSON.stringify(optimization),
        category: 'BUDGET_OPTIMIZE',
      },
    });

    return NextResponse.json({ optimization });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to optimize budget';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
