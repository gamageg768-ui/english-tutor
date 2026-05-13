import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { topic, position, exchanges = [], level = 'B2' } = await req.json();
  const exchText = exchanges.slice(0, 8).map((e: { role: string; content: string }) => `${e.role.toUpperCase()}: ${e.content?.slice(0, 200)}`).join('\n');

  const conclusion = await callGroqJson(
    'You are a debate evaluator and English teacher. Return ONLY valid JSON.',
    `Evaluate this ${level} student's debate on "${topic}" (position: ${position}).
Exchanges:\n${exchText}
Return JSON:
{"overall_score":75,"argument_score":7,"language_score":8,"logic_score":7,"strengths":["strength1","strength2"],"improvements":["improvement"],"summary":"comprehensive feedback"}`,
    0.4
  );
  return NextResponse.json({ success: true, conclusion });
}
