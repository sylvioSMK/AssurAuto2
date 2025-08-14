import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'assurauto-secret-key-change-in-production';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validation des champs
    if (!data.firstName || !data.lastName || !data.phone || !data.password) {
      return NextResponse.json(
        { message: 'Prénom, nom, téléphone et mot de passe sont requis.' },
        { status: 400 }
      );
    }

    if (data.password.length < 6) {
      return NextResponse.json(
        { message: 'Le mot de passe doit contenir au moins 6 caractères.' },
        { status: 400 }
      );
    }

    const phoneRegex = /^(\+?228)?[279]\d{7}$/;
    const cleanPhone = data.phone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { message: 'Numéro de téléphone invalide.' },
        { status: 400 }
      );
    }

    // Vérifier si le numéro existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Ce numéro est déjà utilisé.' },
        { status: 409 }
      );
    }

    // Hacher le mot de passe
    const encoder = new TextEncoder();
    const dataToHash = encoder.encode(data.password + cleanPhone);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataToHash);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: cleanPhone,
        password: hashedPassword,
      },
    });

    // Générer un vrai JWT
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' } // Le token expire dans 7 jours
    );

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    return NextResponse.json(
      { message: 'Erreur serveur.' },
      { status: 500 }
    );
  }
}