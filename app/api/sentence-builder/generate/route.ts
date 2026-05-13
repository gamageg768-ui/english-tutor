import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { level = 'B1', exercise_type = 'scramble', grammar_focus = 'present tense', count = 3 } = await req.json();
  const data = await callGroqJson(
    'You are an English sentence building exercise creator. Return ONLY valid JSON.',
    `Create ${count} sentence building exercises for ${level} level (type: ${exercise_type}, focus: ${grammar_focus}).
Return JSON:
{"exercises":[{"type":"${exercise_type}","scrambled_words":["word1","word2","word3"],"correct_sentence":"correct sentence","hint":"hint","grammar_point":"${grammar_focus}","explanation":"why"}],"grammar_focus":"${grammar_focus}"}`,
    0.5
  );
  return NextResponse.json({ success: true, data });
}
