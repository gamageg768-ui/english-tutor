import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSituations } from '@/lib/situations';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const [convs, corrs, custom] = await Promise.all([
    prisma.conversation.findMany({ where: { userId: auth.userId }, select: { situationId: true } }),
    prisma.correction.count({ where: { userId: auth.userId } }),
    prisma.customSituation.count({ where: { userId: auth.userId } }),
  ]);

  const uniqueSituations = new Set(convs.map((c) => c.situationId)).size;

  return NextResponse.json({
    success: true,
    stats: {
      total_conversations: convs.length,
      total_corrections: corrs,
      unique_situations: uniqueSituations,
      total_situations: getSituations().length,
      custom_situations: custom,
    },
  });
}
