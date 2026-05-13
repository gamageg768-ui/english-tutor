import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'english-tutor-secret-key-change-in-production'
);

export async function signToken(payload: { userId: number; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: number; email: string };
  } catch {
    return null;
  }
}

export async function getAuthUser(req?: NextRequest) {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get('authorization');
    token = authHeader?.replace('Bearer ', '');
    if (!token) token = req.cookies.get('token')?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get('token')?.value;
  }

  if (!token) return null;
  return verifyToken(token);
}
