import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { user_sentence, correct_sentence, exercise_type, level = 'B1' } = await req.json();
  const result = await callGroqJson(
    'You are an English sentence checker. Return ONLY valid JSON.',
    `Check if this sentence is correct.
Expected: "${correct_sentence}"
Student: "${user_sentence}"
Exercise type: ${exercise_type}, Level: ${level}
Return JSON: {"correct":true,"score":100,"feedback":"feedback","alternative_accepted":false}`,
    0.2
  );
  return NextResponse.json({ success: true, result });
}
