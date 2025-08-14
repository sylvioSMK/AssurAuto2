import { getTokenFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';
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

    const { insurances, paymentMethod, monthlyContribution } = await request.json();

    // Validation des données
    if (!Array.isArray(insurances) || insurances.length === 0) {
      return NextResponse.json(
        { message: 'Au moins une assurance est requise.' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['yas', 'flooz'].includes(paymentMethod)) {
      return NextResponse.json(
        { message: 'Mode de paiement invalide.' },
        { status: 400 }
      );
    }

    if (!monthlyContribution || monthlyContribution <= 0) {
      return NextResponse.json(
        { message: 'Le montant de la cotisation doit être positif.' },
        { status: 400 }
      );
    }

    // Démarrer une transaction
    await prisma.$transaction(async (prisma) => {
      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Créer les véhicules et assurances
      for (const insurance of insurances) {
        // Vérifier si le véhicule existe déjà
        let vehicle = await prisma.vehicle.findFirst({
          where: {
            userId: decoded.userId,
            model: insurance.vehicleModel,
            brand: insurance.vehicleBrand || 'Inconnu',
            year: parseInt(insurance.vehicleYear) || new Date().getFullYear()
          }
        });

        if (!vehicle) {
          vehicle = await prisma.vehicle.create({
            data: {
              userId: decoded.userId,
              brand: insurance.vehicleBrand || 'Inconnu',
              model: insurance.vehicleModel,
              year: parseInt(insurance.vehicleYear) || new Date().getFullYear(),
              licensePlate: insurance.licensePlate || '',
              vin: insurance.vin || '',
              color: insurance.color || ''
            }
          });
        }

        // Créer ou récupérer le type d'assurance
        let insuranceType = await prisma.insuranceType.findUnique({
          where: { code: insurance.type }
        });

        if (!insuranceType) {
          const typeConfig = {
            auto: { name: 'Assurance Automobile', coverage: 0.8, code: 'auto' },
            tvm: { name: 'TVM', coverage: 0.5, code: 'tvm' },
            visite_technique: { name: 'Visite Technique', coverage: 0.3, code: 'visite_technique' }
          };
          const config = typeConfig[insurance.type as keyof typeof typeConfig] || typeConfig.auto;

          insuranceType = await prisma.insuranceType.create({
            data: {
              name: config.name,
              code: config.code,
              description: `Type d'assurance: ${config.name}`,
              coverage: config.coverage
            }
          });
        }

        // Créer l'assurance
        const newInsurance = await prisma.insurance.create({
          data: {
            userId: decoded.userId,
            vehicleId: vehicle.id,
            insuranceTypeId: insuranceType.id,
            policyNumber: `POL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            startDate: new Date(),
            expirationDate: new Date(insurance.expirationDate),
            estimatedCost: insurance.estimatedCost,
            status: 'active'
          }
        });

        // Créer une alerte pour cette assurance
        const expirationDate = new Date(insurance.expirationDate);
        const alertDate = new Date(expirationDate);
        alertDate.setDate(alertDate.getDate() - 7); // 7 jours avant

        await prisma.alert.create({
          data: {
            userId: decoded.userId,
            insuranceId: newInsurance.id, // ✅ Maintenant on a l'ID
            type: 'expiry',
            title: 'Expiration d\'assurance',
            message: `Votre assurance ${insurance.type} expire dans 7 jours.`,
            alertDate
          }
        });
      }

      // Gérer l'épargne
      const userSavings = await prisma.userSavings.upsert({
        where: { userId: decoded.userId },
        update: {
          monthlyContribution,
          autoContribution: true,
          contributionDay: new Date().getDate()
        },
        create: {
          userId: decoded.userId,
          monthlyContribution,
          autoContribution: true,
          contributionDay: new Date().getDate(),
          totalBalance: 0
        }
      });

      // Gérer les paramètres
      const userSettings = await prisma.userSettings.upsert({
        where: { userId: decoded.userId },
        update: {
          preferredPaymentMethod: paymentMethod
        },
        create: {
          userId: decoded.userId,
          preferredPaymentMethod: paymentMethod
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration sauvegardée avec succès.'
    });
  } catch (error) {
    console.error('Erreur lors de la configuration:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la sauvegarde.' },
      { status: 500 }
    );
  }
}