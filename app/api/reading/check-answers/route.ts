import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { passage, question, user_answer, level = 'B1' } = await req.json();
  const evaluation = await callGroqJson(
    'You are an English reading comprehension evaluator. Return ONLY valid JSON.',
    `Evaluate this ${level} student's answer.
Passage excerpt: ${passage?.slice(0, 400)}
Question: ${question}
Student answer: ${user_answer}
Return JSON: {"score":7,"feedback":"feedback","model_answer":"model answer"}`,
    0.3
  );
  return NextResponse.json({ success: true, evaluation });
}
