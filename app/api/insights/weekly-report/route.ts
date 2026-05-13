import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callGroqJson } from '@/lib/groq';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [convs, corrs, goals] = await Promise.all([
    prisma.conversation.count({ where: { userId: auth.userId, timestamp: { gte: weekAgo } } }),
    prisma.correction.count({ where: { userId: auth.userId, timestamp: { gte: weekAgo } } }),
    prisma.dailyGoals.findUnique({ where: { userId: auth.userId } }),
  ]);

  const report = await callGroqJson(
    'You are an English learning progress reporter. Return ONLY valid JSON.',
    `Generate weekly report: conversations=${convs}, corrections=${corrs}, streak=${goals?.streak ?? 0}
Return JSON:
{"title":"Weekly Progress Report","summary":"summary","achievements":["achievement"],"improvements":["improvement"],"challenges":["challenge"],"next_week_focus":"focus","encouragement":"motivation","progress_emoji":"📈","stats":{"conversations":${convs},"corrections":${corrs},"streak":${goals?.streak ?? 0}}}`,
    0.7
  );
  return NextResponse.json({ success: true, report });
}
