import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { topic, position, argument, history = [], level = 'B2' } = await req.json();
  const aiPosition = position === 'for' ? 'against' : 'for';
  const histText = history.slice(-4).map((e: { role: string; content: string }) => `${e.role.toUpperCase()}: ${e.content}`).join('\n');

  const response = await callGroqJson(
    'You are a debate opponent and English teacher. Return ONLY valid JSON.',
    `Debate topic: "${topic}" — You argue ${aiPosition}.
${histText ? `Recent exchanges:\n${histText}` : ''}
Student argues ${position}: "${argument}"
Return JSON:
{"counter_argument":"60-100 word counter-argument at ${level} level","evaluation":{"argument_strength":7,"language_quality":7,"persuasiveness":6,"corrections":[{"original":"wrong","corrected":"correct","explanation":"why"}],"suggestions":["improvement tip"]}}`,
    0.5
  );
  return NextResponse.json({ success: true, response });
}
