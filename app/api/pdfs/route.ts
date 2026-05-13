import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const docs = await prisma.pdfDocument.findMany({ orderBy: { uploaded: 'desc' } });

  const pdfs = docs.map(d => ({
    ...d,
    available: d.blobUrl
      ? true
      : fs.existsSync(path.join(process.cwd(), 'public', 'pdfs', d.filename)),
  }));

  return NextResponse.json({ success: true, pdfs });
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { filename } = await req.json();
  if (!filename || typeof filename !== 'string' || filename.includes('..')) {
    return NextResponse.json({ success: false, error: 'Invalid filename' }, { status: 400 });
  }

  try {
    const doc = await prisma.pdfDocument.findUnique({ where: { filename } });
    if (doc?.blobUrl) {
      try { await del(doc.blobUrl); } catch { /* ignore blob delete errors */ }
    } else {
      try { fs.unlinkSync(path.join(process.cwd(), 'public', 'pdfs', filename)); } catch { /* ignore */ }
    }
    await prisma.pdfDocument.delete({ where: { filename } });
  } catch { /* already deleted */ }

  return NextResponse.json({ success: true });
}
