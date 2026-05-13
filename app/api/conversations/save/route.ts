import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { situation_id, situation_title, messages, corrections, timestamp, completed } = await req.json();

  const conv = await prisma.conversation.create({
    data: {
      userId: auth.userId,
      situationId: String(situation_id),
      situationTitle: situation_title,
      messages: JSON.stringify(messages ?? []),
      corrections: JSON.stringify(corrections ?? []),
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      completed: completed ?? true,
    },
  });

  if (corrections?.length) {
    await prisma.correction.createMany({
      data: corrections.map((c: { wrong?: string; original?: string; correct?: string; corrected?: string; full_sentence?: string; fullSentence?: string; reason?: string; explanation?: string; category?: string }) => ({
        userId: auth.userId,
        conversationId: conv.id,
        original: c.wrong ?? c.original ?? '',
        corrected: c.correct ?? c.corrected ?? '',
        fullSentence: c.full_sentence ?? c.fullSentence ?? '',
        explanation: c.reason ?? c.explanation ?? '',
        category: c.category ?? 'Grammar',
      })),
    });
  }

  return NextResponse.json({ success: true, conversation_id: conv.id });
}
