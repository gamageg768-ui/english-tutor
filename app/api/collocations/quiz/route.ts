import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { category = 'business', level = 'B1', quiz_type = 'fill_blank' } = await req.json();
  const quiz = await callGroqJson(
    'You are an English collocations quiz creator. Return ONLY valid JSON.',
    `Create 5 collocation quiz questions (type: ${quiz_type}) for ${level} about "${category}".
Return JSON: {"questions":[{"type":"${quiz_type}","sentence":"sentence with blank","options":["A","B","C","D"],"correct_answer":"correct","collocation":"collocation tested","explanation":"explanation"}]}`,
    0.5
  );
  return NextResponse.json({ success: true, quiz });
}
