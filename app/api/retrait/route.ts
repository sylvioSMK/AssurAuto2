import { NextRequest, NextResponse } from 'next/server';

const PAYGATE_API_URL = "https://paygateglobal.com/api/v1/pay";
const AUTH_TOKEN = process.env.PAYGATE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!AUTH_TOKEN) {
      return NextResponse.json(
        { success: false, message: 'Clé API non définie', status: 500 },
        { status: 500 }
      );
    }

    const { phone, password, type, amount } = await request.json();

    // Vérification des champs
    if (!phone || !password || !type || !amount) {
      return NextResponse.json(
        { success: false, message: 'Données manquantes', status: 4 },
        { status: 400 }
      );
    }

    // Mapping du type vers le nom du réseau PayGate
    const networkMap: Record<string, string> = {
      moov: 'FLOOZ',
      yass: 'TMONEY',
    };

    const network = networkMap[type.toLowerCase()];
    if (!network) {
      return NextResponse.json(
        { success: false, message: 'Type de retrait invalide', status: 4 },
        { status: 400 }
      );
    }

    // Nettoyage du numéro de téléphone
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^(\+228|00228|228)?(9[01237]|70)[0-9]{6}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: 'Numéro de téléphone invalide', status: 11 },
        { status: 400 }
      );
    }

    const finalPhone = cleanPhone.startsWith('228') ? cleanPhone : `228${cleanPhone}`;
    const identifier = `withdraw_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Appel API PayGate
    const response = await fetch(PAYGATE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        auth_token: AUTH_TOKEN,
        phone_number: finalPhone,
        amount: parseInt(amount),
        description: "Retrait de fonds",
        identifier,
        network,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: 'Erreur lors de l\'appel à l\'API PayGate', error: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Succès
    if (data.status === 0) {
      return NextResponse.json(
        {
          success: true,
          status: data.status,
          tx_reference: data.tx_reference,
          message: "Transaction initiée. Confirmez sur votre téléphone.",
        },
        { status: 200 }
      );
    }

    // Échec PayGate
    return NextResponse.json(
      {
        success: false,
        status: data.status,
        message: getPayGateErrorMessage(data.status),
      },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("Erreur API retrait:", error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error.message },
      { status: 500 }
    );
  }
}

function getPayGateErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    1: 'Transaction échouée',
    2: 'Jeton invalide (clé API)',
    4: 'Paramètres invalides',
    6: 'Transaction en double',
    8: 'Solde insuffisant',
    9: 'Transaction annulée',
    10: 'Limite atteinte',
    11: 'Numéro incorrect',
    12: 'Service indisponible',
    13: 'Erreur opérateur',
  };
  return messages[status] || "Erreur inconnue PayGate.";
}