import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSituations } from '@/lib/situations';
import { callGroqJson, callGroqChat } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { situation_id, message, history = [] } = await req.json();

  const baseSituations = getSituations();
  const customSituations = await prisma.customSituation.findMany({ where: { userId: auth.userId } });
  const allSituations = [
    ...baseSituations,
    ...customSituations.map((c) => ({ ...JSON.parse(c.scenario), id: c.id })),
  ];

  const situation = allSituations.find((s) => String(s.id) === String(situation_id));
  if (!situation) return NextResponse.json({ success: false, error: 'Situation not found' }, { status: 404 });

  const systemPrompt = situation.system_prompt ??
    `You are an English tutor playing the role of ${situation.role}. Help the student practice English conversation. Stay in character. Be encouraging and natural.`;

  const [corrections, aiReply] = await Promise.all([
    callGroqJson<{ corrections: Array<{ wrong: string; correct: string; full_sentence: string; reason: string; category: string }> }>(
      'You are an English grammar checker. Return ONLY valid JSON with no extra text.',
      `Check this English text for grammar errors: "${message}"

Return ONLY this JSON:
{
  "corrections": [
    {
      "wrong": "the exact wrong word or phrase copied from the text",
      "correct": "the corrected word or phrase only",
      "full_sentence": "the entire original sentence rewritten correctly",
      "reason": "Explain the specific grammar rule violated and why this is wrong. Be concrete and educational (e.g. 'The past tense of the irregular verb go is went, not goed.').",
      "category": "Grammar | Vocabulary | Spelling | Punctuation"
    }
  ]
}

If there are no errors return: {"corrections": []}`,
      0.2
    ).then((r) => r.corrections ?? []),
    callGroqChat(
      systemPrompt,
      [
        ...history.slice(-8).map((h: { role: string; content: string }) => ({
          role: h.role === 'tutor' ? 'assistant' : 'user' as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user' as const, content: message },
      ]
    ),
  ]);

  const encouragement =
    corrections.length === 0 ? 'Perfect grammar! Keep it up!' :
    corrections.length === 1 ? 'Good effort! Just one small correction.' :
    'Good try! Let\'s fix a few things.';

  return NextResponse.json({
    success: true,
    reply: aiReply,
    corrections,
    encouragement,
    follow_up: '',
    level: situation.level ?? 'B1',
    goal_progress: message.split(' ').length > 10 ? 'advancing' : 'in_progress',
    situation: {
      id: situation.id,
      title: situation.title,
      role: situation.role,
      level: situation.level,
      domain: situation.domain,
      module: situation.module,
    },
  });
}
