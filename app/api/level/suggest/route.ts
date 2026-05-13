import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { corrections_count = 0, conversations_count = 1, current_level = 'A2', sample_text = '' } = await req.json();
  const errorRate = (corrections_count / Math.max(conversations_count, 1) * 100).toFixed(1);

  const suggestion = await callGroqJson(
    'You are a CEFR English level assessor. Return ONLY valid JSON.',
    `Suggest CEFR level. Current: ${current_level}, Error rate: ${errorRate}% (${corrections_count}/${conversations_count}), Sample: "${sample_text}"
Return JSON: {"suggested_level":"B1","reasoning":"explanation","focus_areas":["area1","area2","area3"]}`,
    0.3
  );
  return NextResponse.json({ success: true, suggestion });
}
