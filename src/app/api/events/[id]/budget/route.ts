/**
 * Budget Items API — CRUD for an event's budget.
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { createBudgetItemSchema, updateBudgetItemSchema } from '@/lib/schemas';
import { sanitizeInput } from '@/lib/sanitize';

/** GET /api/events/[id]/budget */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findFirst({ where: { id: params.id, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const items = await prisma.budgetItem.findMany({
    where: { eventId: params.id },
    orderBy: { createdAt: 'asc' },
  });

  const totalEstimated = items.reduce((s, i) => s + (i.estimated ?? 0), 0);
  const totalActual = items.reduce((s, i) => s + (i.actual ?? 0), 0);

  return NextResponse.json({ items, totalEstimated, totalActual, totalBudget: event.totalBudget });
}

/** POST /api/events/[id]/budget */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findFirst({ where: { id: params.id, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = createBudgetItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const item = await prisma.budgetItem.create({
    data: {
      eventId: params.id,
      category: sanitizeInput(data.category, 100),
      description: data.description ? sanitizeInput(data.description, 500) : null,
      estimated: data.estimated ?? null,
      actual: data.actual ?? null,
      status: data.status ?? 'PENDING',
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}

/** PUT /api/events/[id]/budget — update a budget item (pass itemId in body) */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findFirst({ where: { id: params.id, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { itemId, ...rest } = body;
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

  const parsed = updateBudgetItemSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const item = await prisma.budgetItem.update({
    where: { id: itemId },
    data: parsed.data,
  });

  return NextResponse.json({ item });
}

/** DELETE /api/events/[id]/budget — delete a budget item (pass itemId in body) */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findFirst({ where: { id: params.id, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

  await prisma.budgetItem.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}
