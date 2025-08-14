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

    // Récupérer les informations de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userSavings: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Utilisateur non trouvé.' },
        { status: 404 }
      );
    }

    // Récupérer le solde total des économies et la contribution mensuelle
    const totalBalance = user.userSavings?.totalBalance || 0;
    const monthlyContribution = user.userSavings?.monthlyContribution || 0;

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        totalBalance,
        monthlyContribution
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la récupération des informations utilisateur.' },
      { status: 500 }
    );
  }
}
