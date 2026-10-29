import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, passwordHash: hashed },
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
