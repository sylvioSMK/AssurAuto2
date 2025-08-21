import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { phone, password } = await req.json();

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
    return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { phone: cleanPhone },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ message: 'Mot de passe réinitialisé' });
}