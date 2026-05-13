import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const corrections = await prisma.correction.findMany({
    where: { userId: auth.userId },
    include: { conversation: { select: { situationTitle: true } } },
    orderBy: { timestamp: 'desc' },
  });

  return NextResponse.json({
    success: true,
    corrections: corrections.map((c) => ({
      id: c.id,
      conversation_id: c.conversationId,
      original: c.original,
      corrected: c.corrected,
      fullSentence: c.fullSentence,
      explanation: c.explanation,
      category: c.category,
      timestamp: c.timestamp.toISOString(),
      situation_title: c.conversation?.situationTitle,
    })),
    total: corrections.length,
  });
}
