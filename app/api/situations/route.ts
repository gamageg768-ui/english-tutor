import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSituations } from '@/lib/situations';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const domain = searchParams.get('domain');
  const module = searchParams.get('module');

  let baseSituations = getSituations();
  if (domain) baseSituations = baseSituations.filter((s) => s.domain === domain);
  if (module) baseSituations = baseSituations.filter((s) => s.module === module);

  const custom = await prisma.customSituation.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: 'desc' },
  });

  const customMapped = custom.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    level: c.level,
    scenario: c.scenario,
    domain: 'Custom',
    module: 'My Situations',
    role: 'Tutor',
    is_custom: true,
    created_at: c.createdAt.toISOString(),
  }));

  return NextResponse.json({
    success: true,
    situations: [...baseSituations, ...customMapped],
    total: baseSituations.length + customMapped.length,
    base_count: baseSituations.length,
    custom_count: customMapped.length,
  });
}
