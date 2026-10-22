/**
 * Events API — CRUD operations with auth + validation.
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { createEventSchema } from '@/lib/schemas';
import { sanitizeInput } from '@/lib/sanitize';

/** GET /api/events — list all events for the authenticated user */
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      type: true,
      totalBudget: true,
      eventDate: true,
      status: true,
      guestCount: true,
      location: true,
      theme: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ events });
}

/** POST /api/events — create a new event */
export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const event = await prisma.event.create({
    data: {
      userId,
      title: sanitizeInput(data.title, 200),
      type: data.type,
      totalBudget: data.totalBudget,
      eventDate: new Date(data.eventDate),
      location: data.location ? sanitizeInput(data.location, 500) : null,
      guestCount: data.guestCount ?? null,
      theme: data.theme ? sanitizeInput(data.theme, 200) : null,
      notes: data.notes ? sanitizeInput(data.notes, 2000) : null,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}
