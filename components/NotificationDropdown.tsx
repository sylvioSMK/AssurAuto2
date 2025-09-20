'use client';

import { useState, useRef, useEffect } from 'react';
import { Alert } from '@/types/dashboard';

interface NotificationDropdownProps {
  alerts: Alert[];
  userId: string;
}

export default function NotificationDropdown({ alerts, userId }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Filtrer les alertes comme dans 'Prochaines Échéances' (alertes non lues)
  const unreadAlerts = alerts.filter(alert => !alert.isRead);
  
  // Fonction pour calculer le nombre de jours restants
  const getDaysUntilExpiry = (expirationDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expirationDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Fonction pour générer un message dynamique
  const getDynamicMessage = (alert: Alert) => {
    if (alert.type === 'expiry' && alert.insurance && alert.insurance.expirationDate) {
      const daysLeft = getDaysUntilExpiry(alert.insurance.expirationDate);
      
      if (daysLeft > 0) {
        return `Votre ${alert.insurance.insuranceType?.name || alert.insurance.type} pour votre ${alert.insurance.vehicle?.model || 'véhicule'} expire dans ${daysLeft} jours.`;
      } else if (daysLeft === 0) {
        return `Votre ${alert.insurance.insuranceType?.name || alert.insurance.type} pour votre ${alert.insurance.vehicle?.model || 'véhicule'} expire aujourd'hui!`;
      } else {
        return `Votre ${alert.insurance.insuranceType?.name || alert.insurance.type} pour votre ${alert.insurance.vehicle?.model || 'véhicule'} a expiré il y a ${Math.abs(daysLeft)} jours.`;
      }
    }
    
    if (alert.type === 'payment_reminder') {
      return alert.message;
    }

    // Retourner le message original si aucune information d'assurance n'est disponible ou type inconnu
    return alert.message;
  };
  
  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleMarkAsRead = async (alertId: string) => {
    try {
      await fetch(`/api/dashboard/alerts/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alertId }),
        credentials: 'include'
      });
      // Refresh alerts after marking as read
      window.location.reload();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
    // Fermer le dropdown après avoir marqué comme lu
    setIsOpen(false);
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`/api/dashboard/alerts/read-all`, {
        method: 'POST',
        credentials: 'include'
      });
      // Refresh alerts after marking all as read
      window.location.reload();
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
    // Fermer le dropdown après avoir tout marqué comme lu
    setIsOpen(false);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500 cursor-pointer"
      >
        <i className="ri-notification-3-line text-xl"></i>
        {unreadAlerts.length > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              {unreadAlerts.length > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {unreadAlerts.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {unreadAlerts.map((alert) => (
                  <li key={alert.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{getDynamicMessage(alert)}</p>
                      </div>
                      <button 
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 ml-2"
                      >
                        <i className="ri-check-line"></i>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center">
                <i className="ri-notification-off-line text-2xl text-gray-400 mx-auto mb-2"></i>
                <p className="text-gray-500">Aucune notification</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
