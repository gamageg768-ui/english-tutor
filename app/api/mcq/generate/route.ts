import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { topic, level = 'B1', count = 5 } = await req.json();
  const n = Math.min(count, 10);

  const mcq_data = await callGroqJson(
    'You are an English quiz creator. Return ONLY valid JSON.',
    `Create ${n} MCQ questions about "${topic}" for ${level} English learners.
Return JSON: {"topic":"${topic}","questions":[{"question":"question","options":["A","B","C","D"],"correctAnswer":"correct option","explanation":"why"}]}`,
    0.5
  );
  return NextResponse.json({ success: true, mcq_data });
}
