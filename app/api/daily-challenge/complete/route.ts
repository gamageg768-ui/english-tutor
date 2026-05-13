import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { challenge_type, score = 100 } = await req.json();
  const today = new Date().toISOString().split('T')[0];

  await prisma.dailyChallenge.upsert({
    where: { userId_challengeDate: { userId: auth.userId, challengeDate: today } },
    update: { completed: true, score, completedAt: new Date() },
    create: { userId: auth.userId, challengeDate: today, challengeType: challenge_type, completed: true, score, completedAt: new Date() },
  });

  const challenges = await prisma.dailyChallenge.findMany({ where: { userId: auth.userId, completed: true }, orderBy: { challengeDate: 'desc' } });
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < challenges.length; i++) {
    const diff = Math.floor((now.getTime() - new Date(challenges[i].challengeDate).getTime()) / 86400000);
    if (diff === i) streak++;
    else break;
  }

  return NextResponse.json({ success: true, message: 'Challenge completed!', streak, score });
}
