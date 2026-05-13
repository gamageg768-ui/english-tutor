import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { word } = await req.json();
  const data = await callGroqJson(
    'You are an English collocations expert. Return ONLY valid JSON.',
    `List common collocations for the word "${word}".
Return JSON: {"word":"${word}","collocations":[{"phrase":"collocation phrase","example":"example sentence","type":"verb+noun/adj+noun etc"}]}`,
    0.4
  );
  return NextResponse.json({ success: true, data });
}
