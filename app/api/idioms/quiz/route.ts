import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { category = 'general', level = 'B1' } = await req.json();
  const quiz = await callGroqJson(
    'You are an English idioms quiz creator. Return ONLY valid JSON.',
    `Create 5 MCQ questions about English idioms for ${level} students (category: ${category}).
Return JSON: {"questions":[{"idiom":"idiom","question":"What does X mean?","options":["A","B","C","D"],"correct_answer":"correct","explanation":"explanation"}]}`,
    0.5
  );
  return NextResponse.json({ success: true, quiz });
}
