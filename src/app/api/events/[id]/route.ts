/**
 * Single Event API — GET, PUT, DELETE with ownership checks.
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { updateEventSchema } from '@/lib/schemas';
import { sanitizeInput } from '@/lib/sanitize';

/** GET /api/events/[id] — get event details */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findFirst({
    where: { id: params.id, userId },
    include: {
      budgetItems: { orderBy: { createdAt: 'asc' } },
      milestones: { orderBy: { sortOrder: 'asc' } },
      vendors: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ event });
}

/** PUT /api/events/[id] — update event */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Ownership check
  const existing = await prisma.event.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...(data.title && { title: sanitizeInput(data.title, 200) }),
      ...(data.type && { type: data.type }),
      ...(data.totalBudget !== undefined && { totalBudget: data.totalBudget }),
      ...(data.eventDate && { eventDate: new Date(data.eventDate) }),
      ...(data.location !== undefined && { location: data.location ? sanitizeInput(data.location, 500) : null }),
      ...(data.guestCount !== undefined && { guestCount: data.guestCount }),
      ...(data.theme !== undefined && { theme: data.theme ? sanitizeInput(data.theme, 200) : null }),
      ...(data.notes !== undefined && { notes: data.notes ? sanitizeInput(data.notes, 2000) : null }),
      ...(data.status && { status: data.status }),
    },
  });

  return NextResponse.json({ event });
}

/** DELETE /api/events/[id] */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.event.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Delete all related records first
  await prisma.budgetItem.deleteMany({ where: { eventId: params.id } });
  await prisma.milestone.deleteMany({ where: { eventId: params.id } });
  await prisma.vendor.deleteMany({ where: { eventId: params.id } });
  await prisma.aIConversation.deleteMany({ where: { eventId: params.id } });
  await prisma.event.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
