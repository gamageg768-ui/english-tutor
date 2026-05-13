import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const words = await prisma.vocabulary.findMany({ where: { userId: auth.userId }, orderBy: { savedAt: 'desc' } });
  return NextResponse.json({ success: true, words, total: words.length });
}
