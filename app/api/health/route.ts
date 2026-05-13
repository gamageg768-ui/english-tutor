import { NextResponse } from 'next/server';
import { getSituations } from '@/lib/situations';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    model: 'llama3-8b-8192 (Groq)',
    total_situations: getSituations().length,
  });
}
