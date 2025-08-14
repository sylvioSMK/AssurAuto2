import { NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'assurauto-secret-key';

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { message: 'Token d\'authentification manquant.' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
    } catch (error) {
      return NextResponse.json(
        { message: 'Token invalide ou expiré.' },
        { status: 401 }
      );
    }

    // Récupérer les alertes de l'utilisateur
    const userAlerts = await prisma.alert.findMany({
      where: { userId: decoded.userId },
      orderBy: { dateCreated: 'desc' }
    });

    return NextResponse.json({
      alerts: userAlerts
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la récupération des alertes.' },
      { status: 500 }
    );
  }
}
