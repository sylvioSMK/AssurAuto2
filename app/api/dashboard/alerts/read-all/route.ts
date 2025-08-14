import { NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'assurauto-secret-key';

export async function POST(request: Request) {
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

    // Marquer toutes les alertes comme lues
    const updatedAlerts = await prisma.alert.updateMany({
      where: { 
        userId: decoded.userId,
        isRead: false
      },
      data: { isRead: true }
    });

    return NextResponse.json({
      message: `${updatedAlerts.count} alertes marquées comme lues`,
      count: updatedAlerts.count
    });
  } catch (error) {
    console.error('Erreur lors du marquage des alertes comme lues:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors du marquage des alertes comme lues.' },
      { status: 500 }
    );
  }
}
