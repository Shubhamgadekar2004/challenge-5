import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { suggestIdeas } from '@/lib/gemini';
import { parseModelJson } from '@/lib/ai-json';

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!checkRateLimit(`${userId}:suggest-ideas`)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { eventId, category } = await req.json();
  if (!eventId || typeof eventId !== 'string') {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }
  if (!category || typeof category !== 'string') {
    return NextResponse.json({ error: 'category required' }, { status: 400 });
  }

  const event = await prisma.event.findFirst({ where: { id: eventId, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const raw = await suggestIdeas(
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
      category
    );

    const ideas = parseModelJson<Array<{ idea: string; description: string; estimatedCost: string }>>(raw);

    await prisma.aIConversation.create({
      data: {
        eventId: event.id,
        prompt: `Suggest ideas for ${category}`,
        response: JSON.stringify(ideas),
        category: 'SUGGEST_IDEAS',
      },
    });

    return NextResponse.json({ ideas });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to suggest ideas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
