/**
 * Timeline / Milestones API — CRUD for event milestones.
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { createMilestoneSchema, updateMilestoneSchema } from '@/lib/schemas';
import { sanitizeInput } from '@/lib/sanitize';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findFirst({ where: { id: params.id, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const milestones = await prisma.milestone.findMany({
    where: { eventId: params.id },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json({ milestones, eventDate: event.eventDate });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findFirst({ where: { id: params.id, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = createMilestoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const milestone = await prisma.milestone.create({
    data: {
      eventId: params.id,
      title: sanitizeInput(data.title, 200),
      description: data.description ? sanitizeInput(data.description, 1000) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      completed: data.completed ?? false,
      sortOrder: data.sortOrder ?? 0,
    },
  });

  return NextResponse.json({ milestone }, { status: 201 });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findFirst({ where: { id: params.id, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { itemId, ...rest } = body;
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

  const parsed = updateMilestoneSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const milestone = await prisma.milestone.update({
    where: { id: itemId },
    data: {
      ...(data.title && { title: sanitizeInput(data.title, 200) }),
      ...(data.description !== undefined && { description: data.description ? sanitizeInput(data.description, 1000) : null }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.completed !== undefined && { completed: data.completed }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  });

  return NextResponse.json({ milestone });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findFirst({ where: { id: params.id, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

  await prisma.milestone.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}
