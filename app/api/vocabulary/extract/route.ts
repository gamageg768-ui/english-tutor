import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { text, level = 'B1' } = await req.json();
  const result = await callGroqJson<{ words: unknown[] }>(
    'You are a vocabulary extraction tool. Return ONLY valid JSON.',
    `Extract 3-5 useful vocabulary words from this text for ${level} English learners: "${text}"
Return JSON: {"words": [{"word": "word", "pos": "noun/verb/adj", "definition": "meaning", "example": "example sentence"}]}`,
    0.3
  );
  return NextResponse.json({ success: true, words: result.words ?? [] });
}
