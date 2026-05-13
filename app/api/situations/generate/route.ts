import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { description, level = 'A2', timestamp } = await req.json();
    if (!description?.trim()) return NextResponse.json({ success: false, error: 'Description required' }, { status: 400 });

    const situation = await callGroqJson(
      'You are a language learning content creator. Return ONLY valid JSON with no extra text.',
      `Create an English conversation practice situation based on: "${description}" for level ${level} learners.
Return ONLY this JSON object:
{
  "title": "Brief title (max 50 chars)",
  "description": "Clear description (1-2 sentences)",
  "role": "AI tutor role (e.g. Restaurant Server)",
  "user_role": "Student role (e.g. Customer)",
  "goal": "What student must accomplish",
  "domain": "Academic",
  "module": "Conversation",
  "level": "${level}",
  "system_prompt": "You are playing the role of [role]. The student is practicing [goal]. Stay in character, correct grammar mistakes gently, and help them practice naturally."
}`,
      0.7
    );

    if (!situation || typeof situation !== 'object' || !('title' in situation)) {
      return NextResponse.json({ success: false, error: 'AI returned invalid response. Please try again.' }, { status: 500 });
    }

    const count = await prisma.customSituation.count({ where: { userId: auth.userId } });
    const id = `custom_${auth.userId}_${count + 1}`;

    return NextResponse.json({
      success: true,
      situation: { ...situation, id, is_custom: true, created_at: timestamp ?? new Date().toISOString() },
    });
  } catch (err) {
    console.error('[/api/situations/generate]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Generation failed: ${message}` }, { status: 500 });
  }
}
