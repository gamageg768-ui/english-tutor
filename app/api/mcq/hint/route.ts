import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { question, options = [], topic } = await req.json();
  const hint_data = await callGroqJson(
    'You are an English teacher providing hints. Return ONLY valid JSON.',
    `Give a hint for this MCQ without revealing the answer:
Question: ${question}
Options: ${options.join(', ')}
Topic: ${topic}
Return JSON: {"hint":"helpful hint","grammar_rule":"relevant rule","think_about":"what to consider"}`,
    0.5
  );
  return NextResponse.json({ success: true, hint_data });
}
