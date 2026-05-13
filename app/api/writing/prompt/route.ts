import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { level = 'B1', topic = 'general' } = await req.json();
  const prompt = await callGroqJson(
    'You are an English writing teacher. Return ONLY valid JSON.',
    `Generate a writing prompt for ${level} level about "${topic}".
Return JSON: {"title":"title","prompt":"detailed prompt","suggested_word_count":150,"tips":["tip1","tip2","tip3"],"vocabulary_hints":["word1","word2","word3"],"level":"${level}","topic":"${topic}"}`,
    0.7
  );
  return NextResponse.json({ success: true, prompt });
}
