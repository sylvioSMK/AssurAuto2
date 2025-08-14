import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Déconnexion réussie' });
    
    // Effacer le cookie de token
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Expire immédiatement
      path: '/',
      sameSite: 'strict',
    });
    
    return response;
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    return NextResponse.json(
      { message: 'Erreur serveur.' },
      { status: 500 }
    );
  }
}
