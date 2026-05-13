import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const situations = await prisma.customSituation.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, situations, total: situations.length });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { situation } = await req.json();
  if (!situation) return NextResponse.json({ success: false, error: 'Situation required' }, { status: 400 });

  const count = await prisma.customSituation.count({ where: { userId: auth.userId } });
  const id = situation.id?.startsWith('custom_') ? situation.id : `custom_${auth.userId}_${count + 1}`;

  await prisma.customSituation.upsert({
    where: { id },
    update: { title: situation.title, description: situation.description ?? '', level: situation.level, scenario: JSON.stringify(situation) },
    create: {
      id,
      userId: auth.userId,
      title: situation.title,
      description: situation.description ?? '',
      level: situation.level,
      scenario: JSON.stringify(situation),
    },
  });

  const total = await prisma.customSituation.count({ where: { userId: auth.userId } });
  return NextResponse.json({ success: true, situation: { ...situation, id, is_custom: true }, total_custom: total });
}
