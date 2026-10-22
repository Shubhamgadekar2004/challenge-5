import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { parseModelJson } from '@/lib/ai-json';
import { recommendVendors } from '@/lib/gemini';

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!checkRateLimit(`${userId}:vendor-recommend`)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { eventId } = await req.json();
  if (!eventId || typeof eventId !== 'string') {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }

  const event = await prisma.event.findFirst({ where: { id: eventId, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const raw = await recommendVendors({
      type: event.type,
      title: event.title,
      eventDate: event.eventDate.toISOString(),
      totalBudget: event.totalBudget,
      guestCount: event.guestCount ?? undefined,
      theme: event.theme ?? undefined,
      location: event.location ?? undefined,
      notes: event.notes ?? undefined,
    });

    const recommendations = parseModelJson<{
      vendors: Array<{
        category: string;
        priority: 'ESSENTIAL' | 'RECOMMENDED' | 'OPTIONAL';
        notes: string;
        suggestedBudgetRange: string;
      }>;
    }>(raw);

    await prisma.aIConversation.create({
      data: {
        eventId: event.id,
        prompt: 'Recommend vendors',
        response: JSON.stringify(recommendations),
        category: 'VENDOR_RECOMMEND',
      },
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to recommend vendors';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
