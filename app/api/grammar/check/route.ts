import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { text, topic = '' } = await req.json();
  if (!text) return NextResponse.json({ success: false, error: 'Text required' }, { status: 400 });

  const feedback = await callGroqJson(
    'You are an English writing evaluator. Return ONLY valid JSON.',
    `Analyze this English writing: "${text}"${topic ? ` (Topic: ${topic})` : ''}
Return JSON:
{"score":8,"summary":"overall assessment","errors":[{"original":"wrong","corrected":"correct","type":"grammar","explanation":"why"}],"style_suggestions":["tip"],"vocabulary_improvements":[{"original":"word","suggested":"better","reason":"why"}],"strengths":["strength"],"improved_version":"rewritten text"}`,
    0.3
  );
  return NextResponse.json({ success: true, feedback });
}
