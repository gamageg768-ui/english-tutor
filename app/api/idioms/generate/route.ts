import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { category = 'daily life', level = 'B1' } = await req.json();
  const data = await callGroqJson(
    'You are an English idioms teacher. Return ONLY valid JSON.',
    `Generate 6 English idioms about "${category}" for ${level} learners.
Return JSON: {"category":"${category}","idioms":[{"idiom":"phrase","meaning":"meaning","origin":"origin","examples":["ex1","ex2"],"similar":"similar expression"}]}`,
    0.7
  );
  return NextResponse.json({ success: true, data });
}
