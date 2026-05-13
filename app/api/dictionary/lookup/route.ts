import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { word } = await req.json();
  if (!word) return NextResponse.json({ success: false, error: 'Word required' }, { status: 400 });

  const word_info = await callGroqJson(
    'You are an expert English dictionary. Return ONLY valid JSON.',
    `Provide comprehensive dictionary information for: "${word}"
Return JSON:
{"word":"${word}","pronunciation":"/IPA/","pos":"part of speech","definition":"clear definition","etymology":"word origin","examples":["ex1","ex2","ex3"],"synonyms":["s1","s2","s3"],"antonyms":["a1","a2"],"collocations":["c1","c2","c3"],"usage_notes":"usage tips"}`,
    0.3
  );

  return NextResponse.json({ success: true, word_info });
}
