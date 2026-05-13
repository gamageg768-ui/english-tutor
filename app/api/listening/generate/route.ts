import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { level = 'B1', topic = 'daily life' } = await req.json();
  const wordRange = ['A1','A2'].includes(level) ? '80-150' : ['B1','B2'].includes(level) ? '150-250' : '250-350';

  const exercise = await callGroqJson(
    'You are an English listening comprehension creator. Return ONLY valid JSON.',
    `Create a listening comprehension exercise (${wordRange} words) for ${level} about "${topic}".
Return JSON:
{"title":"title","passage":"passage text","level":"${level}","topic":"${topic}","questions":[{"question":"q","options":["A","B","C","D"],"correct_answer":"correct","explanation":"explanation"}],"key_vocabulary":["word1","word2","word3"]}`,
    0.6
  );
  return NextResponse.json({ success: true, exercise });
}
