import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { front, back, category = 'Grammar' } = await req.json();
  const flashcard = await prisma.flashcard.create({
    data: { userId: auth.userId, front, back, category },
  });
  return NextResponse.json({ success: true, flashcard });
}
