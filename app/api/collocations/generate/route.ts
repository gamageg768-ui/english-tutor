import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { category = 'business', level = 'B1' } = await req.json();
  const data = await callGroqJson(
    'You are an English collocations teacher. Return ONLY valid JSON.',
    `Generate 6 English collocations about "${category}" for ${level} learners.
Return JSON: {"category":"${category}","collocations":[{"collocation":"make a decision","meaning":"meaning","example":"example sentence","common_mistake":"common error","word_type":"verb+noun"}]}`,
    0.6
  );
  return NextResponse.json({ success: true, data });
}
