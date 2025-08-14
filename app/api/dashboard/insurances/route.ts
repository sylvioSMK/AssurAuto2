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

    // Récupérer les assurances de l'utilisateur
    const userInsurances = await prisma.insurance.findMany({
      where: { userId: decoded.userId },
      include: {
        vehicle: true,
        insuranceType: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formater les données pour le frontend
    const formattedInsurances = userInsurances.map(insurance => {
      const expirationDate = new Date(insurance.expirationDate);
      const today = new Date();
      const timeDiff = expirationDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      let status: 'active' | 'expiring_soon' | 'expired' = 'active';
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 7) {
        status = 'expiring_soon';
      }
      
      return {
        id: insurance.id,
        type: insurance.insuranceType.name,
        vehicleModel: insurance.vehicle.model,
        vehicleYear: insurance.vehicle.year.toString(),
        expirationDate: insurance.expirationDate.toISOString(),
        estimatedCost: insurance.estimatedCost,
        status,
        daysUntilExpiry
      };
    });

    return NextResponse.json({
      insurances: formattedInsurances
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des assurances:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la récupération des assurances.' },
      { status: 500 }
    );
  }
}
