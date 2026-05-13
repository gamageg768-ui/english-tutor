import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();
    if (!username || !email || !password)
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
    });
    await prisma.dailyGoals.create({ data: { userId: user.id } });

    const token = await signToken({ userId: user.id, email: user.email });
    return NextResponse.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    if (msg.includes('Unique')) return NextResponse.json({ success: false, error: 'Username or email already exists' }, { status: 409 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
