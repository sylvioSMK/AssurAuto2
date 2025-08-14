import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'assurauto-secret-key-change-in-production';

// Chemins qui ne nécessitent pas d'authentification
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/_next',
  '/favicon.ico',
  '/images',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Vérifier si le chemin est public
  const isPublicPath = publicPaths.some(path => 
    pathname.startsWith(path)
  );
  
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Pour les chemins protégés, vérifier l'authentification
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    // Rediriger vers la page de login si aucun token n'est présent
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    // Vérifier la validité du token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ajouter les informations utilisateur aux headers
    const response = NextResponse.next();
    response.headers.set('x-user-id', (decoded as any).userId);
    
    return response;
  } catch (error) {
    // Token invalide, rediriger vers la page de login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Configurer les routes auxquelles le middleware s'applique
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
