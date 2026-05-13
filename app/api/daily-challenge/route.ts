import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];
  const existing = await prisma.dailyChallenge.findUnique({ where: { userId_challengeDate: { userId: auth.userId, challengeDate: today } } });

  if (existing) {
    const streak = await getChallengeStreak(auth.userId);
    return NextResponse.json({ success: true, challenge: { ...existing, streak }, already_completed: existing.completed });
  }

  const types = ['writing', 'idiom', 'listening', 'grammar', 'vocabulary'];
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
  const challengeType = types[seed % types.length];

  const prompts: Record<string, string> = {
    writing: "Write 3-5 sentences about what you would do if you could travel anywhere tomorrow.",
    idiom: "Learn and use these idioms in sentences: 'break the ice', 'hit the nail on the head', 'a piece of cake'.",
    listening: "Read a passage about daily routines and answer comprehension questions.",
    grammar: "Complete 5 fill-in-the-blank exercises focusing on present perfect tense.",
    vocabulary: "Learn 5 new technology words and use each in a sentence.",
  };

  const streak = await getChallengeStreak(auth.userId);
  const challenge = { challenge_date: today, challenge_type: challengeType, title: `Daily ${challengeType.charAt(0).toUpperCase() + challengeType.slice(1)} Challenge`, description: prompts[challengeType], completed: false, score: 0, streak };
  return NextResponse.json({ success: true, challenge, already_completed: false });
}

async function getChallengeStreak(userId: number): Promise<number> {
  const challenges = await prisma.dailyChallenge.findMany({ where: { userId, completed: true }, orderBy: { challengeDate: 'desc' } });
  if (!challenges.length) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < challenges.length; i++) {
    const d = new Date(challenges[i].challengeDate);
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff === i) streak++;
    else break;
  }
  return streak;
}
