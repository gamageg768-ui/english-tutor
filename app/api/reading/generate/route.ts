import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { level = 'B1', topic = 'technology', passage_type = 'article' } = await req.json();
  const wordRange = ['A1','A2'].includes(level) ? '80-120' : ['B1','B2'].includes(level) ? '150-250' : '250-350';

  const exercise = await callGroqJson(
    'You are an English reading comprehension creator. Return ONLY valid JSON.',
    `Create a reading comprehension exercise (${wordRange} words) for ${level} about "${topic}" (${passage_type}).
Return JSON:
{"title":"title","passage":"passage text","word_count":200,"level":"${level}","topic":"${topic}","passage_type":"${passage_type}","questions":[{"type":"mcq","question":"q","options":["A","B","C","D"],"correct_answer":"correct","explanation":"explanation","skill":"main_idea"},{"type":"true_false","question":"statement","options":["True","False"],"correct_answer":"True","explanation":"explanation","skill":"detail"},{"type":"short_answer","question":"q","correct_answer":"model answer","explanation":"explanation","skill":"vocabulary"}],"vocabulary":[{"word":"word","definition":"def","context_sentence":"sentence"}],"summary_prompt":"Write a 2-3 sentence summary."}`,
    0.6
  );
  return NextResponse.json({ success: true, exercise });
}
