import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { messages = [], corrections = [] } = await req.json();
  const convText = messages.slice(0, 20).map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n');
  const corrText = corrections.slice(0, 10).map((c: { wrong?: string; correct?: string; reason?: string }) => `- ${c.wrong} → ${c.correct}: ${c.reason}`).join('\n');

  const analysis = await callGroqJson(
    'You are an English learning coach. Return ONLY valid JSON.',
    `Analyze this English conversation for learning insights.
Conversation:
${convText}
Corrections: ${corrText || 'None'}
Return JSON:
{"overall_rating":7,"communication_score":7,"grammar_score":8,"vocabulary_score":7,"summary":"assessment","patterns":["pattern"],"strengths":["strength"],"weaknesses":["weakness"],"vocabulary_level":"B1","recommendations":["recommendation"],"next_focus":"focus area"}`,
    0.4
  );

  return NextResponse.json({ success: true, analysis });
}
