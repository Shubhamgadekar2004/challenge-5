import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { aiChatSchema } from '@/lib/schemas';
import { chatWithAI } from '@/lib/gemini';
import { sanitizeInput } from '@/lib/sanitize';

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!checkRateLimit(`${userId}:chat`)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const body = await req.json();
  const { eventId, message } = body as { eventId?: string; message?: string };
  if (!eventId || typeof eventId !== 'string') {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }

  const parsed = aiChatSchema.safeParse({ message });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const event = await prisma.event.findFirst({ where: { id: eventId, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const cleanedMessage = sanitizeInput(parsed.data.message, 2000);
    const response = await chatWithAI(
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
      cleanedMessage
    );

    await prisma.aIConversation.create({
      data: {
        eventId: event.id,
        prompt: cleanedMessage,
        response,
        category: 'CHAT',
      },
    });

    return NextResponse.json({ response });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get chat response';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
