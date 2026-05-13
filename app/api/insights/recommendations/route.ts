import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callGroqJson } from '@/lib/groq';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const [convs, corrs, vocab, goals] = await Promise.all([
    prisma.conversation.count({ where: { userId: auth.userId } }),
    prisma.correction.findMany({ where: { userId: auth.userId }, select: { category: true } }),
    prisma.vocabulary.count({ where: { userId: auth.userId } }),
    prisma.dailyGoals.findUnique({ where: { userId: auth.userId } }),
  ]);

  const errorCounts: Record<string, number> = {};
  corrs.forEach((c) => { errorCounts[c.category] = (errorCounts[c.category] ?? 0) + 1; });
  const topErrors = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => `${t} (${n})`).join(', ') || 'None yet';

  const recommendations = await callGroqJson(
    'You are a personalized English learning coach. Return ONLY valid JSON.',
    `Analyze: conversations=${convs}, corrections=${corrs.length}, vocabulary=${vocab}, streak=${goals?.streak ?? 0}, top errors: ${topErrors}
Return JSON:
{"focus_areas":["area1","area2","area3"],"recommended_activities":[{"activity":"name","reason":"why","priority":"high"}],"weekly_goals":[{"goal":"goal","metric":"metric"}],"motivation":"personalized message","strength":"what they do well","next_step":"immediate action"}`,
    0.6
  );
  return NextResponse.json({ success: true, recommendations });
}
