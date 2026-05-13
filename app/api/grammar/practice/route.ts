import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { topic, level = 'B1', type = 'fill_blank' } = await req.json();
  const practice = await callGroqJson(
    'You are an English grammar teacher. Return ONLY valid JSON.',
    `Create 3 grammar practice exercises for ${level} level about "${topic}" (type: ${type}).
Return JSON: {"topic":"${topic}","exercises":[{"question":"exercise","answer":"correct answer","explanation":"explanation"}],"tip":"grammar tip"}`,
    0.5
  );
  return NextResponse.json({ success: true, practice });
}
