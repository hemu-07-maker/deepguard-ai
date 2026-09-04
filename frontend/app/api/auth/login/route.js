import { NextResponse } from 'next/server';
import { findByEmail } from '@/lib/users';
import { verifyPassword, createToken, sessionCookie } from '@/lib/session';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = findByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = createToken({ userId: user.id, email: user.email, name: user.name });
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
    res.headers.set('Set-Cookie', sessionCookie(token));
    return res;
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
