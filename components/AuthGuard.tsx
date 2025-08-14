'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Fonction de vérification d'authentification qui peut être appelée explicitement
  const checkAuth = async () => {
    try {
      // Vérification serveur
      const response = await fetch('/api/auth/verify', { credentials: 'include' });
      if (!response.ok) {
        // Nettoyer les données de session
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        return false;
      }

      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Erreur vérification authentification:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  // Exposer la fonction de vérification pour les composants enfants
  useEffect(() => {
    // Ajouter la fonction checkAuth à l'objet window pour y accéder depuis les composants enfants
    (window as any).checkAuth = checkAuth;
    
    return () => {
      // Nettoyer lors du démontage
      delete (window as any).checkAuth;
    };
  }, []);

  // Vérification initiale - uniquement pour les pages non publiques
  useEffect(() => {
    // Ne pas vérifier l'authentification sur les pages publiques
    const publicPaths = ['/', '/login',];
    if (publicPaths.includes(pathname)) {
      setIsAuthenticated(true);
      return;
    }

    // Pour le dashboard, effectuer une vérification complète
    if (pathname === '/dashboard') {
      const verifyAuth = async () => {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
          router.replace('/login');
        }
      };
      verifyAuth();
      return;
    }

    // Vérification initiale simplifiée pour les autres pages protégées
    const user = localStorage.getItem('user');
    if (!user) {
      setIsAuthenticated(false);
      router.replace('/login');
      return;
    }

    setIsAuthenticated(true);
  }, [pathname, router]);

  // Pendant la vérification, ne rien afficher
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, ne pas afficher le contenu
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
