import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroq } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { question, wrong_answer, correct_answer, topic } = await req.json();
  const explanation = await callGroq(
    'You are a concise English teacher.',
    `Briefly explain (2-3 sentences) why "${wrong_answer}" is wrong and "${correct_answer}" is correct for: "${question}" (topic: ${topic})`,
    0.4
  );
  return NextResponse.json({ success: true, explanation });
}
