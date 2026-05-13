import { NextRequest, NextResponse } from 'next/server';
import { callGroqJson } from '@/lib/groq';

export async function GET(req: NextRequest) {
  const today = new Date().toISOString().split('T')[0];
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0) % 100;

  const word_of_day = await callGroqJson(
    'You are an expert English vocabulary teacher. Return ONLY valid JSON.',
    `Select interesting English word #${seed} (for learners). Return JSON:
{"word":"word","pronunciation":"/IPA/","pos":"part of speech","definition":"clear definition","etymology":"origin","examples":["ex1","ex2","ex3"],"synonyms":["s1","s2"],"fun_fact":"interesting fact","memory_trick":"memory tip","difficulty":"intermediate","date":"${today}"}`,
    0.7
  );

  return NextResponse.json({ success: true, word_of_day: { ...word_of_day, date: today } });
}
