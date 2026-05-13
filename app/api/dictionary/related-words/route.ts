import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { word } = await req.json();
  const related_words = await callGroqJson(
    'You are an English vocabulary expert. Return ONLY valid JSON.',
    `For English word "${word}", provide related words.
Return JSON:
{"word":"${word}","word_family":[{"word":"form","pos":"part of speech","example":"example"}],"synonyms_detailed":[{"word":"syn","difference":"how it differs"}],"antonyms":["a1","a2"],"commonly_confused":[{"word":"confused","difference":"distinction"}],"collocations":[{"phrase":"phrase","example":"usage"}]}`,
    0.4
  );
  return NextResponse.json({ success: true, related_words });
}
