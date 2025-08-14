import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    const user = getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Token invalide' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        userId: user.userId,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Erreur vérification:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
