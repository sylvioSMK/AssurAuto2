import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'assurauto-secret-key-change-in-production';

export interface UserPayload {
  userId: string;
  phone: string;
}

/**
 * Vérifie la validité d'un token JWT
 */
export function verifyToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extrait et vérifie le token depuis les cookies ou les headers
 */
export function getTokenFromRequest(request: Request): string | null {
  // Pour les requêtes API avec cookies (Next.js API routes)
  if ((request as any).cookies) {
    const cookies = (request as any).cookies;
    if (cookies.token) {
      return cookies.token;
    }
  }
  
  // Pour les requêtes fetch avec cookie automatique
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        acc[name] = value;
      }
      return acc;
    }, {});
    
    if (cookies.token) {
      return cookies.token;
    }
  }
  
  // Pour les requêtes API avec header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * Vérifie l'authentification de l'utilisateur
 */
export function isAuthenticated(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  
  return verifyToken(token) !== null;
}

/**
 * Récupère les informations de l'utilisateur depuis le token
 */
export function getUserFromToken(token: string): UserPayload | null {
  return verifyToken(token);
}
