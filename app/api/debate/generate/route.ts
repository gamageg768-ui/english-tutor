import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { level = 'B2', category = 'technology' } = await req.json();
  const debate = await callGroqJson(
    'You are a debate coach. Return ONLY valid JSON.',
    `Generate a debate topic for ${level} English learners about "${category}".
Return JSON:
{"topic":"debate topic question","your_position":"for","background":"2-3 sentence background","key_points":["point1","point2","point3"],"useful_phrases":["phrase1","phrase2","phrase3","phrase4","phrase5"]}`,
    0.7
  );
  return NextResponse.json({ success: true, debate });
}
