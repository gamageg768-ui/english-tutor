import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const conv = await prisma.conversation.findFirst({
    where: { id: parseInt(id), userId: auth.userId },
  });

  if (!conv) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    success: true,
    conversation: {
      id: conv.id,
      situation_id: conv.situationId,
      situation_title: conv.situationTitle,
      messages: JSON.parse(conv.messages),
      corrections: JSON.parse(conv.corrections),
      timestamp: conv.timestamp.toISOString(),
      completed: conv.completed,
    },
  });
}
