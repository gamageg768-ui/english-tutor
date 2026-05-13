import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { difficulty = 'medium' } = await req.json();
  const exercises = await callGroqJson(
    'You are an English pronunciation coach. Return ONLY valid JSON.',
    `Generate 5 pronunciation exercises at ${difficulty} difficulty.
Include tongue twisters, minimal pairs, and challenging phrases.
Return JSON:
{"difficulty":"${difficulty}","exercises":[{"type":"tongue_twister","text":"text","ipa":"/IPA/","tips":"pronunciation tips","common_mistakes":"watch out for","focus_sound":"key sound"}]}`,
    0.6
  );
  return NextResponse.json({ success: true, exercises });
}
