import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const [convs, corrs, vocab, cards, goals] = await Promise.all([
    prisma.conversation.findMany({ where: { userId: auth.userId }, select: { timestamp: true } }),
    prisma.correction.findMany({ where: { userId: auth.userId }, select: { category: true, timestamp: true } }),
    prisma.vocabulary.count({ where: { userId: auth.userId } }),
    prisma.flashcard.count({ where: { userId: auth.userId } }),
    prisma.dailyGoals.findUnique({ where: { userId: auth.userId } }),
  ]);

  const today = new Date();
  const dailyStats: Record<string, { conversations: number; corrections: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dailyStats[d.toISOString().split('T')[0]] = { conversations: 0, corrections: 0 };
  }

  convs.forEach((c) => {
    const k = c.timestamp.toISOString().split('T')[0];
    if (dailyStats[k]) dailyStats[k].conversations++;
  });
  corrs.forEach((c) => {
    const k = c.timestamp.toISOString().split('T')[0];
    if (dailyStats[k]) dailyStats[k].corrections++;
  });

  const corrByCategory: Record<string, number> = {};
  corrs.forEach((c) => { corrByCategory[c.category] = (corrByCategory[c.category] ?? 0) + 1; });

  const topErrors = Object.entries(corrByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  return NextResponse.json({
    success: true,
    analytics: {
      overview: {
        total_conversations: convs.length,
        total_corrections: corrs.length,
        vocabulary_learned: vocab,
        flashcards_created: cards,
        current_streak: goals?.streak ?? 0,
      },
      corrections_by_category: corrByCategory,
      daily_stats: dailyStats,
      top_errors: topErrors,
      improvement_rate: Math.max(0, 100 - (corrs.length / Math.max(convs.length, 1)) * 10),
    },
  });
}
