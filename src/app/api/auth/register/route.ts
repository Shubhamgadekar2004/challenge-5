import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { normalizeEmail, sanitizeInput } from '@/lib/sanitize';

const registerSchema = z.object({
  name: z.string().trim().max(200).optional().default(''),
  email: z.string().trim().email('Please enter a valid email address').max(254),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid registration data';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { name, password } = parsed.data;
    const email = normalizeEmail(parsed.data.email);
    const safeName = sanitizeInput(name, 200);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name: safeName, passwordHash: hashed },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create account';
    const dbHint = message.toLowerCase().includes('database_url') || message.toLowerCase().includes('prisma')
      ? ' Database is not configured. Set DATABASE_URL to a valid postgres URL and run: npx prisma db push.'
      : '';

    return NextResponse.json(
      { error: `Signup failed.${dbHint}`.trim() },
      { status: 500 }
    );
  }
}
