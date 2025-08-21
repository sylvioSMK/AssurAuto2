import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(request: Request) {
  const { phone, password } = await request.json();

  if (!phone || !password) {
    return NextResponse.json({ message: 'Champs manquants' }, { status: 400 });
  }

  const cleanPhone = phone.replace(/[\s.-]/g, '').trim();
  const phoneRegex = /^\+228[1-9]\d{7}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return NextResponse.json({ message: 'Numéro invalide' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { phone: cleanPhone } });
  if (!user) {
    return NextResponse.json({ message: 'Identifiants invalides' }, { status: 401 });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json({ message: 'Identifiants invalides' }, { status: 401 });
  }

  const token = jwt.sign({ userId: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });

  const response = NextResponse.json({
    user: { id: user.id, firstName: user.firstName, lastName: user.lastName, phone: user.phone },
  });

  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 604800,
    path: '/',
  });

  return response;
}