import { NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'assurauto-secret-key';

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

    // Marquer l'alerte comme lue
    const alertId = params.id;
    const updatedAlert = await prisma.alert.update({
      where: { 
        id: alertId,
        userId: decoded.userId
      },
      data: { isRead: true }
    });

    return NextResponse.json({
      message: 'Alerte marquée comme lue',
      alert: updatedAlert
    });
  } catch (error) {
    console.error('Erreur lors du marquage de l\'alerte comme lue:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors du marquage de l\'alerte comme lue.' },
      { status: 500 }
    );
  }
}
