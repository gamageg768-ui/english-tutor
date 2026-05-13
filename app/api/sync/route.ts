import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  let syncedSituations = 0;

  if (data.custom_situations?.length) {
    for (const sit of data.custom_situations) {
      const id = sit.id ?? `custom_${auth.userId}_${Date.now()}`;
      await prisma.customSituation.upsert({
        where: { id },
        update: { title: sit.title, description: sit.description ?? '', level: sit.level, scenario: JSON.stringify(sit) },
        create: { id, userId: auth.userId, title: sit.title, description: sit.description ?? '', level: sit.level, scenario: JSON.stringify(sit) },
      });
      syncedSituations++;
    }
  }

  return NextResponse.json({ success: true, message: 'Sync completed', synced: { situations: syncedSituations } });
}
