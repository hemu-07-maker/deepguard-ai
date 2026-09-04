import { NextResponse } from 'next/server';
import { createUser, findByEmail } from '@/lib/users';
import { hashPassword, createToken, sessionCookie } from '@/lib/session';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (findByEmail(email)) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const user = createUser({
      email,
      passwordHash: hashPassword(password),
      name: name || email.split('@')[0],
    });

    const token = createToken({ userId: user.id, email: user.email, name: user.name });
    const res = NextResponse.json({ user });
    res.headers.set('Set-Cookie', sessionCookie(token));
    return res;
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 });
  }
}
