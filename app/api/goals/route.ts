import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];
  let goals = await prisma.dailyGoals.findUnique({ where: { userId: auth.userId } });

  if (!goals) {
    goals = await prisma.dailyGoals.create({ data: { userId: auth.userId } });
  }

  if (goals.currentDate !== today) {
    goals = await prisma.dailyGoals.update({
      where: { userId: auth.userId },
      data: { conversationsToday: 0, mcqCorrectToday: 0, currentDate: today },
    });
  }

  return NextResponse.json({
    success: true,
    goals: {
      conversations_target: goals.conversationsTarget,
      mcq_target: goals.mcqTarget,
      today: { conversations: goals.conversationsToday, mcq_correct: goals.mcqCorrectToday, date: goals.currentDate },
      streak: goals.streak,
      last_activity_date: goals.lastActivityDate,
    },
  });
}
