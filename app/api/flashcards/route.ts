import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const dueOnly = new URL(req.url).searchParams.get('due_only') === 'true';
  const flashcards = await prisma.flashcard.findMany({
    where: dueOnly
      ? { userId: auth.userId, nextReview: { lte: new Date() } }
      : { userId: auth.userId },
    orderBy: dueOnly ? { nextReview: 'asc' } : { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, flashcards, total: flashcards.length });
}
