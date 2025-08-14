import { Alert, Insurance } from '@/types/dashboard';

export function useFilteredAlerts(alerts: Alert[], insurances: Insurance[]) {
  // Créer un map pour accéder rapidement aux assurances par ID
  const insuranceMap = new Map<string, Insurance>();
  insurances.forEach(insurance => {
    insuranceMap.set(insurance.id, insurance);
  });

  // Filtrer les alertes comme dans 'Prochaines Échéances' (dans les 30 prochains jours)
  const relevantAlerts = alerts.filter(alert => {
    // Si ce n'est pas une alerte d'expiration, la montrer si elle n'est pas lue
    if (alert.type !== 'expiry') {
      return !alert.isRead;
    }
    
    // Pour les alertes d'expiration, vérifier si l'assurance associée est dans les 30 prochains jours
    if (alert.insuranceId) {
      const associatedInsurance = insuranceMap.get(alert.insuranceId);
      if (associatedInsurance && associatedInsurance.daysUntilExpiry <= 30 && associatedInsurance.daysUntilExpiry >= 0) {
        return !alert.isRead;
      }
      // Si l'assurance n'est plus dans les 30 prochains jours, ne pas montrer l'alerte
      return false;
    }
    
    // Pour les alertes d'expiration sans assurance associée, les montrer si elles ne sont pas lues
    return !alert.isRead;
  });
  
  return relevantAlerts;
}
