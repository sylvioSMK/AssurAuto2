'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import NotificationDropdown from '@/components/NotificationDropdown';

interface Insurance {
  id: string;
  type: string;
  vehicleModel: string;
  vehicleYear: string;
  expirationDate: string;
  estimatedCost: number;
  status: 'active' | 'expiring_soon' | 'expired';
  daysUntilExpiry: number;
}

interface User {
  id: string; // Prisma cuid() est un string
  firstName: string;
  lastName: string;
  email: string;
  totalBalance: number;
  monthlyContribution: number;
}

import { Alert } from '@/lib/types';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const authGuardRef = useRef<{ checkAuth: () => Promise<boolean> }>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Charger les données utilisateur depuis le serveur pour s'assurer qu'elles sont à jour
        const userResponse = await fetch('/api/dashboard/user', {
          credentials: 'include'
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
          localStorage.setItem('user', JSON.stringify(userData.user));
          
          // Charger les assurances
          const insurancesResponse = await fetch('/api/dashboard/insurances', {
            credentials: 'include'
          });
          if (insurancesResponse.ok) {
            const insurancesData = await insurancesResponse.json();
            setInsurances(insurancesData.insurances || []);
          }

          // Charger les alertes
          const alertsResponse = await fetch('/api/dashboard/alerts', {
            credentials: 'include'
          });
          if (alertsResponse.ok) {
            const alertsData = await alertsResponse.json();
            setAlerts(alertsData.alerts || []);
          }
        } else {
          // Si nous ne pouvons pas récupérer les données utilisateur, rediriger vers la page de login
          router.replace('/login');
          return;
        }
      } catch (error) {
        console.error('Erreur:', error);
        // En cas d'erreur, rediriger vers la page de login
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  // Revalider l'auth lors d'une restauration BFCache (retour/avancer navigateur)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if ((event as any).persisted) {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (!token || !storedUser) {
          // Si les identifiants ont été nettoyés (ex: retour vers login), empêcher l'accès
          router.replace('/login');
        }
      }
    };
    
    // Vérifier également lors de la navigation par l'historique
    const handlePopState = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (!token || !storedUser) {
        // Si les identifiants ont été nettoyés, empêcher l'accès
        router.replace('/login');
      }
    };
    
    window.addEventListener('pageshow', handlePageShow as any);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow as any);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  // 🔐 Fonction de déconnexion sécurisée
  const handleLogout = async () => {
    try {
      // Appeler l'API de déconnexion pour effacer le cookie
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // 🔐 Supprimer toutes les données sensibles
      localStorage.removeItem('user');
      
      // 🔐 Forcer la destruction de l'état
      setUser(null);
      
      // 🔁 Rediriger vers la page de connexion
      router.replace('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, rediriger vers la page de connexion
      router.replace('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expiring_soon': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return 'ri-checkbox-circle-line text-green-600';
      case 'expiring_soon': return 'ri-time-line text-yellow-600';
      case 'expired': return 'ri-close-circle-line text-red-600';
      default: return 'ri-question-line text-gray-600';
    }
  };

  // Fonction pour vérifier l'authentification avant la navigation
  const handleNavigationClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetUrl = e.currentTarget.href;
    
    // Vérifier l'authentification
    try {
      const response = await fetch('/api/auth/verify', { credentials: 'include' });
      if (response.ok) {
        // Si l'authentification est valide, permettre la navigation
        window.location.href = targetUrl;
      } else {
        // Si l'authentification échoue, rediriger vers la page de login
        localStorage.removeItem('user');
        router.replace('/login');
      }
    } catch (error) {
      console.error('Erreur vérification authentification:', error);
      localStorage.removeItem('user');
      router.replace('/login');
    }
  };

  const totalEstimatedCost = insurances.reduce((sum, ins) => sum + ins.estimatedCost, 0);
  const coveragePercentage = totalEstimatedCost > 0 ? Math.min((user.totalBalance / totalEstimatedCost) * 100, 100) : 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-shield-check-line text-xl text-white"></i>
                </div>
                <h1 className="text-2xl font-bold text-blue-600 font-['Pacifico']">AssurAuto</h1>
              </Link>
              <nav className="flex space-x-6">
                <Link href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors cursor-pointer" onClick={handleNavigationClick}>
                  Accueil
                </Link>
                <Link href="/dashboard" className="text-blue-600 font-medium px-3 py-2 rounded-md cursor-pointer bg-blue-50">
                  Dashboard
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {/* 🔔 Notifications */}
              <NotificationDropdown 
                alerts={alerts}
                onMarkAsRead={async (alertId) => {
                  try {
                    const response = await fetch(`/api/dashboard/alerts/read/${alertId}`, { method: 'POST' });
                    if (response.ok) {
                      setAlerts(alerts.map(alert => 
                        alert.id === alertId ? { ...alert, isRead: true } : alert
                      ));
                    }
                  } catch (error) {
                    console.error('Erreur lors du marquage comme lu:', error);
                  }
                }}
                onMarkAllAsRead={async () => {
                  try {
                    const response = await fetch(`/api/dashboard/alerts/read-all`, { method: 'POST' });
                    if (response.ok) {
                      setAlerts(alerts.map(alert => ({ ...alert, isRead: true })));
                    }
                  } catch (error) {
                    console.error('Erreur lors du marquage comme lu:', error);
                  }
                }}
              />

              {/* 👤 Profil */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </span>
                </div>
                <span className="text-gray-700">{user.firstName} {user.lastName}</span>
              </div>

              {/* 🔴 Bouton de déconnexion */}
              <button
                onClick={handleLogout}
                className="ml-4 bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors cursor-pointer flex items-center whitespace-nowrap text-sm sm:text-base"
                aria-label="Se déconnecter"
              >
                <i className="ri-logout-box-line mr-2 text-lg"></i>
                <span className="hidden sm:inline">Déconnexion</span>
                <span className="sm:hidden">Déco</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Bienvenue, {user.firstName} !</h1>
              <p className="text-blue-100">Voici un aperçu de vos assurances et de votre épargne</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Dernière connexion</p>
              <p className="text-white font-medium">{new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-2xl text-green-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Épargne Totale</p>
                <p className="text-2xl font-bold text-green-600">{user.totalBalance?.toLocaleString()} FCFA</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-calendar-line text-2xl text-blue-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cotisation Mensuelle</p>
                <p className="text-2xl font-bold text-blue-600">{user.monthlyContribution?.toLocaleString()} FCFA</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="ri-shield-check-line text-2xl text-purple-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assurances Actives</p>
                <p className="text-2xl font-bold text-purple-600">{insurances.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="ri-percent-line text-2xl text-orange-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Couverture</p>
                <p className="text-2xl font-bold text-orange-600">{Math.round(coveragePercentage)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assurances */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <i className="ri-shield-line mr-2 text-blue-600"></i>
                    Mes Assurances
                  </h2>
                  <Link href="/setup-insurance" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap">
                    <i className="ri-add-line mr-2"></i>
                    Ajouter
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {insurances.length > 0 ? (
                  insurances.map((insurance) => (
                    <div key={insurance.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            insurance.status === 'active' ? 'bg-green-100' :
                            insurance.status === 'expiring_soon' ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            <i className={`text-xl ${getStatusIcon(insurance.status)}`}></i>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{insurance.type}</h3>
                            <p className="text-sm text-gray-600">
                              {insurance.vehicleModel} ({insurance.vehicleYear})
                            </p>
                            <p className="text-sm text-gray-500">
                              Expire le {new Date(insurance.expirationDate).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${getStatusColor(insurance.status)}`}>
                            {insurance.status === 'active' && 'Actif'}
                            {insurance.status === 'expiring_soon' && 'Expire bientôt'}
                            {insurance.status === 'expired' && 'Expiré'}
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            {insurance.estimatedCost.toLocaleString()} FCFA
                          </p>
                          {insurance.daysUntilExpiry > 0 ? (
                            <p className="text-sm text-gray-500">
                              Dans {insurance.daysUntilExpiry} jours
                            </p>
                          ) : (
                            <p className="text-sm text-red-600">
                              Expiré depuis {Math.abs(insurance.daysUntilExpiry)} jours
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <i className="ri-shield-line text-4xl mb-4 text-gray-300"></i>
                    <p>Aucune assurance configurée</p>
                    <Link href="/setup-insurance" className="mt-2 inline-block text-blue-600 hover:text-blue-700 cursor-pointer">
                      Ajouter votre première assurance
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-6">
            {/* Graphique de couverture */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="ri-pie-chart-line mr-2 text-blue-600"></i>
                Couverture Financière
              </h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      Épargné
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {Math.round(coveragePercentage)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div
                    style={{ width: `${Math.min(coveragePercentage, 100)}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-300"
                  ></div>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Épargné:</span>
                  <span className="font-medium">{user.totalBalance?.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Objectif:</span>
                  <span className="font-medium">{totalEstimatedCost.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="ri-lightning-line mr-2 text-orange-600"></i>
                Actions Rapides
              </h3>
              <div className="space-y-3">
                <Link href="/contribute" className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center cursor-pointer whitespace-nowrap" onClick={handleNavigationClick}>
                  <i className="ri-add-circle-line mr-2"></i>
                  Effectuer une cotisation
                </Link>
                <Link href="/withdraw" className="w-full bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center cursor-pointer whitespace-nowrap" onClick={handleNavigationClick}>
                  <i className="ri-money-dollar-circle-line mr-2"></i>
                  Retirer des fonds
                </Link>
                {/* <Link href="/renew" className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center cursor-pointer whitespace-nowrap" onClick={handleNavigationClick}>
                  <i className="ri-refresh-line mr-2"></i>
                  Renouveler une assurance
                </Link> */}
              </div>
            </div>

            {/* Prochaines échéances */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="ri-calendar-event-line mr-2 text-purple-600"></i>
                Prochaines Échéances
              </h3>
              <div className="space-y-3">
                {insurances
                  .filter((ins) => ins.daysUntilExpiry <= 30 && ins.daysUntilExpiry >= 0)
                  .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
                  .map((insurance) => (
                    <div key={insurance.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <i className="ri-time-line text-yellow-600"></i>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{insurance.type}</p>
                        <p className="text-xs text-gray-600">Dans {insurance.daysUntilExpiry} jours</p>
                      </div>
                    </div>
                  ))}
                {insurances.filter((ins) => ins.daysUntilExpiry <= 30 && ins.daysUntilExpiry >= 0).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Aucune échéance dans les 30 prochains jours</p>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  </div>
  </AuthGuard>
  );
}