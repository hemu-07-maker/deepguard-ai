import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/session';

export async function GET(request) {
  const token = getTokenFromRequest(request);
  const data = verifyToken(token);
  if (!data) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    user: { id: data.userId, email: data.email, name: data.name },
  });
}
