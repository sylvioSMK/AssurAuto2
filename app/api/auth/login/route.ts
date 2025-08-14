import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'assurauto-secret-key-change-in-production';

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json(
        { message: 'Téléphone et mot de passe requis.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\s/g, '');

    const user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Identifiants invalides.' },
        { status: 401 }
      );
    }

    // Hacher le mot de passe entré
    const encoder = new TextEncoder();
    const dataToHash = encoder.encode(password + cleanPhone);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataToHash);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashedPassword !== user.password) {
      return NextResponse.json(
        { message: 'Identifiants invalides.' },
        { status: 401 }
      );
    }

    // Générer un vrai JWT
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        createdAt: user.createdAt,
      }
    });

    // Set the token as an HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'strict',
    });

    return response;
  } catch (error) {
    console.error('Erreur login:', error);
    return NextResponse.json(
      { message: 'Erreur serveur.' },
      { status: 500 }
    );
  }
}