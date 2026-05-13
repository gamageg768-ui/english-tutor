import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { user_corrections = [], expected_errors = [] } = await req.json();
  const result = await callGroqJson(
    'You are an English error correction evaluator. Return ONLY valid JSON.',
    `Compare student corrections to expected errors.
Expected: ${JSON.stringify(expected_errors.slice(0, 10))}
Student found: ${JSON.stringify(user_corrections.slice(0, 10))}
Return JSON: {"found":3,"total":${expected_errors.length},"score":60,"correct_fixes":[],"missed_errors":[],"false_positives":[],"feedback":"feedback"}`,
    0.3
  );
  return NextResponse.json({ success: true, result });
}
