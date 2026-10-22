/**
 * Vendors API — CRUD for an event's vendor checklist.
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { createVendorSchema, updateVendorSchema } from '@/lib/schemas';
import { sanitizeInput } from '@/lib/sanitize';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findFirst({ where: { id: params.id, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const vendors = await prisma.vendor.findMany({
    where: { eventId: params.id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ vendors });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findFirst({ where: { id: params.id, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = createVendorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const vendor = await prisma.vendor.create({
    data: {
      eventId: params.id,
      name: sanitizeInput(data.name, 200),
      category: sanitizeInput(data.category, 100),
      contact: data.contact ? sanitizeInput(data.contact, 200) : null,
      email: data.email ? sanitizeInput(data.email, 254) : null,
      quotedPrice: data.quotedPrice ?? null,
      status: data.status ?? 'RESEARCHING',
      notes: data.notes ? sanitizeInput(data.notes, 2000) : null,
    },
  });

  return NextResponse.json({ vendor }, { status: 201 });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findFirst({ where: { id: params.id, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { itemId, ...rest } = body;
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

  const parsed = updateVendorSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const vendor = await prisma.vendor.update({
    where: { id: itemId },
    data: {
      ...(data.name !== undefined && { name: sanitizeInput(data.name, 200) }),
      ...(data.category !== undefined && { category: sanitizeInput(data.category, 100) }),
      ...(data.contact !== undefined && { contact: data.contact ? sanitizeInput(data.contact, 200) : null }),
      ...(data.email !== undefined && { email: data.email ? sanitizeInput(data.email, 254) : null }),
      ...(data.quotedPrice !== undefined && { quotedPrice: data.quotedPrice }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes ? sanitizeInput(data.notes, 2000) : null }),
    },
  });

  return NextResponse.json({ vendor });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findFirst({ where: { id: params.id, userId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

  await prisma.vendor.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}
