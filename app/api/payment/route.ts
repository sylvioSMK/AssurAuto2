import { NextRequest, NextResponse } from 'next/server';

const PAYGATE_API_URL = "https://paygateglobal.com/api/v1/pay";
const AUTH_TOKEN = process.env.PAYGATE_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { amount, phoneNumber, network, identifier, description = 'Contribution sur site' } = await request.json();

    // Validation des champs requis
    if (!amount || !phoneNumber || !network || !identifier) {
      return NextResponse.json(
        { message: 'Paramètres manquants', status: 4 },
        { status: 400 }
      );
    }

    if (!['FLOOZ', 'TMONEY'].includes(network)) {
      return NextResponse.json(
        { message: 'Réseau invalide. Utilisez FLOOZ ou TMONEY', status: 4 },
        { status: 400 }
      );
    }

    // Formatage du numéro (supprimer les espaces, +, etc.)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!/^(228)?(9[0756][0-9]{6})$/.test(cleanPhone)) {
      return NextResponse.json(
        { message: 'Numéro de téléphone invalide', status: 4 },
        { status: 400 }
      );
    }

    // Numéro final (avec indicatif 228)
    const finalPhone = cleanPhone.startsWith('228') ? cleanPhone : `228${cleanPhone}`;

    // Requête vers PayGate
    const response = await fetch(PAYGATE_API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        auth_token: AUTH_TOKEN,
        phone_number: finalPhone,
        amount: parseInt(amount),
        description,
        identifier,
        network
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Réponse PayGate
    if (data.status === 0) {
      return NextResponse.json(
        {
          success: true,
          status: data.status,
          tx_reference: data.tx_reference,
          message: 'Transaction initiée avec succès.',
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          status: data.status,
          message: getPayGateErrorMessage(data.status),
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Erreur dans /api/payment:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur', error: error.message },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour les messages d'erreur
function getPayGateErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    1: 'Transaction échouée',
    2: 'Jeton d’authentification invalide. Vérifiez votre clé API.',
    4: 'Un ou plusieurs paramètres sont invalides.',
    6: 'Une transaction avec cet identifiant existe déjà.',
    8: 'Solde insuffisant',
    9: 'Transaction annulée par l\'utilisateur',
    10: 'Limite de transaction dépassée',
    11: 'Numéro de téléphone invalide',
    12: 'Service temporairement indisponible',
    13: 'Erreur de communication avec l\'opérateur',
  };
  return messages[status] || 'Erreur inconnue auprès de PayGate.';
}
