import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const category = (formData.get('category') as string) || 'General';

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ success: false, error: 'PDF file required' }, { status: 400 });
    }

    const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const displayTitle = title || filename.replace(/\.pdf$/i, '').replace(/_/g, ' ');

    let url: string;
    let blobUrl: string | null = null;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Production / Vercel Blob
      const blob = await put(`pdfs/${filename}`, file, { access: 'public' });
      url = blob.url;
      blobUrl = blob.url;
    } else {
      // Local dev fallback — save to public/pdfs/
      const dir = path.join(process.cwd(), 'public', 'pdfs');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
      url = `/pdfs/${filename}`;
      blobUrl = null;
    }

    await prisma.pdfDocument.upsert({
      where: { filename },
      update: { title: displayTitle, description, category, url, blobUrl },
      create: { filename, title: displayTitle, description, category, url, blobUrl },
    });

    return NextResponse.json({ success: true, filename, url });
  } catch (err) {
    console.error('PDF upload error:', err);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
