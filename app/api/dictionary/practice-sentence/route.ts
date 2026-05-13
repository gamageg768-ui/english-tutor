import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { word, level = 'B1' } = await req.json();
  const exercises = await callGroqJson(
    'You are an English vocabulary teacher. Return ONLY valid JSON.',
    `Create 3 fill-in-the-blank exercises for "${word}" at ${level} level.
Return JSON: {"word":"${word}","exercises":[{"sentence_with_blank":"sentence with _____","answer":"complete sentence","hint":"hint"}]}`,
    0.6
  );
  return NextResponse.json({ success: true, exercises });
}
