import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const today = new Date().toISOString().split('T')[0];

  const goals = await prisma.dailyGoals.upsert({
    where: { userId: auth.userId },
    update: {},
    create: { userId: auth.userId },
  });

  const isNewDay = goals.currentDate !== today;
  const lastDate = goals.lastActivityDate;
  let streak = goals.streak;

  if (lastDate) {
    const diff = Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000);
    if (diff === 1) streak += 1;
    else if (diff > 1) streak = 1;
  } else {
    streak = 1;
  }

  const updated = await prisma.dailyGoals.update({
    where: { userId: auth.userId },
    data: {
      conversationsToday: isNewDay ? (data.conversations ?? 0) : { increment: data.conversations ?? 0 },
      mcqCorrectToday: isNewDay ? (data.mcq_correct ?? 0) : { increment: data.mcq_correct ?? 0 },
      currentDate: today,
      streak,
      lastActivityDate: today,
    },
  });

  return NextResponse.json({
    success: true,
    goals: {
      conversations_target: updated.conversationsTarget,
      mcq_target: updated.mcqTarget,
      today: { conversations: updated.conversationsToday, mcq_correct: updated.mcqCorrectToday, date: updated.currentDate },
      streak: updated.streak,
    },
  });
}
