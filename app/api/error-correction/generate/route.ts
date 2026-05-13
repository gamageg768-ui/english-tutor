import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { level = 'B1', topic = 'daily life', error_count = 5 } = await req.json();
  const exercise = await callGroqJson(
    'You are an English error correction exercise creator. Return ONLY valid JSON.',
    `Create an error correction exercise for ${level} with exactly ${error_count} planted errors about "${topic}".
Return JSON:
{"passage_with_errors":"passage with errors","correct_passage":"corrected passage","error_count":${error_count},"errors":[{"wrong":"wrong text","correct":"correct text","type":"Grammar/Spelling/Punctuation/Vocabulary","explanation":"why"}],"topic":"${topic}","level":"${level}"}`,
    0.5
  );
  return NextResponse.json({ success: true, exercise });
}
