import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const existing = await prisma.vocabulary.findFirst({
    where: { userId: auth.userId, word: data.word },
  });
  if (existing) return NextResponse.json({ success: true, word: existing });

  const word = await prisma.vocabulary.create({
    data: {
      userId: auth.userId,
      word: data.word,
      pos: data.pos ?? '',
      definition: data.definition ?? '',
      example: data.example ?? '',
      sourceSituation: data.source_situation ?? '',
    },
  });
  return NextResponse.json({ success: true, word });
}
