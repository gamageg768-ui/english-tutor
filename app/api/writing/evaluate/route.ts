import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { text, prompt: promptText = '', level = 'B1' } = await req.json();
  if (!text) return NextResponse.json({ success: false, error: 'Text required' }, { status: 400 });

  const evaluation = await callGroqJson(
    'You are an expert English writing evaluator. Return ONLY valid JSON.',
    `Evaluate this ${level} student's writing.
Prompt: "${promptText}"
Writing: "${text}"
Return JSON:
{"scores":{"grammar":7,"vocabulary":6,"coherence":8,"style":6,"task_completion":7,"overall":7},"corrections":[{"original":"wrong","corrected":"right","explanation":"why"}],"suggestions":["tip"],"strengths":["strength"],"improved_version":"rewritten text","summary":"overall assessment"}`,
    0.4
  );

  await prisma.writingSubmission.create({
    data: {
      userId: auth.userId,
      prompt: promptText,
      content: text,
      level,
      scores: JSON.stringify((evaluation as { scores?: unknown }).scores ?? {}),
      feedback: (evaluation as { summary?: string }).summary ?? '',
    },
  });

  return NextResponse.json({ success: true, evaluation });
}
