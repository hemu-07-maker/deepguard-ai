import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'deepguard-ai',
    timestamp: new Date().toISOString(),
  });
}
