import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { userId: auth.userId },
    orderBy: { timestamp: 'desc' },
  });

  return NextResponse.json({
    success: true,
    conversations: conversations.map((c) => ({
      id: c.id,
      situation_id: c.situationId,
      situation_title: c.situationTitle,
      messages: JSON.parse(c.messages),
      corrections: JSON.parse(c.corrections),
      timestamp: c.timestamp.toISOString(),
      completed: c.completed,
    })),
    total: conversations.length,
  });
}
