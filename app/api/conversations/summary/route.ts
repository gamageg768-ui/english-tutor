import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callGroqJson } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { conversation_ids } = await req.json();
  const all = await prisma.conversation.findMany({ where: { userId: auth.userId }, take: 10, orderBy: { timestamp: 'desc' } });
  const selected = conversation_ids?.length ? all.filter((c) => conversation_ids.includes(c.id)) : all;

  if (!selected.length) {
    return NextResponse.json({ success: true, summary: { overview: "Start conversations to see your progress!", patterns: [], strengths: ["Ready to begin!"], areas_to_improve: ["Start your first conversation"], recommendations: ["Try a situation from the list"], progress_score: 0 } });
  }

  const totalMsgs = selected.reduce((sum, c) => sum + JSON.parse(c.messages).length, 0);
  const totalCorr = selected.reduce((sum, c) => sum + JSON.parse(c.corrections).length, 0);
  const topics = [...new Set(selected.slice(0, 5).map((c) => c.situationTitle))].join(', ');

  const summary = await callGroqJson(
    'You are an English learning coach. Return ONLY valid JSON.',
    `Summarize ${selected.length} English conversations (${totalMsgs} messages, ${totalCorr} corrections). Topics: ${topics}
Return JSON: {"title":"Summary","total_conversations":${selected.length},"engagement_level":"high","themes":["theme"],"skills_practiced":["skill"],"progress_summary":"summary","recommendation":"next step"}`,
    0.5
  );

  return NextResponse.json({ success: true, summary });
}
