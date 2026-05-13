import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { question, pdfTitle, pdfDescription, history } = await req.json();
  if (!question) return NextResponse.json({ success: false, error: 'Question required' }, { status: 400 });

  const systemPrompt = `You are an expert English language tutor and AI study assistant helping a student read and understand a study material PDF.

PDF Title: "${pdfTitle}"
PDF Description: "${pdfDescription}"

Your role:
- Answer questions about the content of this document clearly and helpfully
- Explain grammar rules, tenses, formulas, and examples from the document
- Give additional examples when helpful
- Keep answers concise but complete
- Use simple language appropriate for English learners
- If asked about something not in the document, still help with related English learning questions`;

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...((history || []) as { role: 'user' | 'assistant'; content: string }[]),
    { role: 'user', content: question },
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.5,
      max_tokens: 600,
    });

    const answer = completion.choices[0]?.message?.content ?? 'Sorry, I could not generate a response.';
    return NextResponse.json({ success: true, answer });
  } catch (err) {
    console.error('PDF ask error:', err);
    return NextResponse.json({ success: false, error: 'AI error' }, { status: 500 });
  }
}
