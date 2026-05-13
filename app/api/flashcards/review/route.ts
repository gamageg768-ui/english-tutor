import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { card_id, quality = 3 } = await req.json();
  const card = await prisma.flashcard.findFirst({ where: { id: card_id, userId: auth.userId } });
  if (!card) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  const newCount = card.reviewCount + 1;
  let ef = card.easeFactor;
  let interval = card.interval;

  if (quality < 3) {
    interval = 1;
    ef = Math.max(1.3, ef - 0.2);
  } else {
    interval = newCount === 1 ? 1 : newCount === 2 ? 6 : Math.round(interval * ef);
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  const updated = await prisma.flashcard.update({
    where: { id: card_id },
    data: { reviewCount: newCount, easeFactor: ef, interval, nextReview },
  });

  return NextResponse.json({ success: true, flashcard: updated });
}
