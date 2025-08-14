'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface InsuranceData {
  type: string;
  vehicleModel: string;
  vehicleYear: string;
  expirationDate: string;
  estimatedCost: number;
  vehicleBrand?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}



export default function SetupInsurance() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(1);
  const [insurances, setInsurances] = useState<InsuranceData[]>([]);
  const [currentInsurance, setCurrentInsurance] = useState<InsuranceData>({
    type: '',
    vehicleModel: '',
    vehicleYear: '',
    expirationDate: '',
    estimatedCost: 0,
    vehicleBrand: ''
  });
  const [totalEstimated, setTotalEstimated] = useState(0);
  const [suggestedContribution, setSuggestedContribution] = useState(0);
  const [customContribution, setCustomContribution] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('yas');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const insuranceTypes = [
    { value: 'auto', label: 'Assurance Automobile', baseCost: 150000 },
    { value: 'tvm', label: 'TVM (Taxe sur Véhicule à Moteur)', baseCost: 25000 },
    { value: 'visite_technique', label: 'Visite Technique', baseCost: 15000 },
  ];

  // 🔁 Restaurer les données au chargement
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/');
      return;
    }
  }, [router]);

  // 🔁 Restaurer les assurances en cours quand l'utilisateur change
  useEffect(() => {
    if (!user) return;
    
    const insuranceStorageKey = `pendingInsurances_${user.id}`;
    const saved = localStorage.getItem(insuranceStorageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      setInsurances(parsed);
      const total = parsed.reduce((sum: number, ins: InsuranceData) => sum + ins.estimatedCost, 0);
      setTotalEstimated(total);
      const suggested = Math.round(total / 12);
      setSuggestedContribution(suggested);
      setCustomContribution(suggested);
    }
  }, [user]);

  // Revalider l'auth lors d'une restauration BFCache (retour/avancer navigateur)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if ((event as any).persisted) {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (!token || !storedUser) {
          // Si les identifiants ont été nettoyés, empêcher l'accès
          router.replace('/');
        }
      }
    };
    
    // Vérifier également lors de la navigation par l'historique
    const handlePopState = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (!token || !storedUser) {
        // Si les identifiants ont été nettoyés, empêcher l'accès
        router.replace('/');
      }
    };
    
    window.addEventListener('pageshow', handlePageShow as any);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow as any);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  // 🔁 Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    if (!user) return;
    
    const insuranceStorageKey = `pendingInsurances_${user.id}`;
    if (insurances.length > 0) {
      localStorage.setItem(insuranceStorageKey, JSON.stringify(insurances));
    } else {
      localStorage.removeItem(insuranceStorageKey);
    }
    const total = insurances.reduce((sum, ins) => sum + ins.estimatedCost, 0);
    setTotalEstimated(total);
    const suggested = Math.round(total / 12);
    setSuggestedContribution(suggested);
    if (customContribution === 0 || customContribution === suggestedContribution) {
      setCustomContribution(suggested);
    }
  }, [insurances, suggestedContribution, customContribution, user]);

  const calculateEstimatedCost = (type: string, year: string) => {
    const baseType = insuranceTypes.find(t => t.value === type);
    if (!baseType) return 0;

    let cost = baseType.baseCost;
    const vehicleAge = new Date().getFullYear() - parseInt(year);

    if (vehicleAge < 3) cost *= 1.2;
    else if (vehicleAge > 10) cost *= 0.8;

    return Math.round(cost);
  };

  const handleInsuranceChange = (field: string, value: string) => {
    const updated = { ...currentInsurance, [field]: value };

    if (field === 'type' || field === 'vehicleYear') {
      const estimatedCost = calculateEstimatedCost(updated.type, updated.vehicleYear);
      updated.estimatedCost = estimatedCost;
    }

    setCurrentInsurance(updated);
  };

  const addInsurance = () => {
    if (currentInsurance.type && currentInsurance.expirationDate) {
      const newInsurances = [...insurances, currentInsurance];
      setInsurances(newInsurances);

      setCurrentInsurance({
        type: '',
        vehicleModel: '',
        vehicleYear: '',
        expirationDate: '',
        estimatedCost: 0,
        vehicleBrand: ''
      });
    }
  };

  const removeInsurance = (index: number) => {
    const updated = insurances.filter((_, i) => i !== index);
    setInsurances(updated);
  };

  const handleComplete = async () => {
    if (!user || insurances.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/auth/setup-insurance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          insurances,
          paymentMethod: selectedPaymentMethod,
          monthlyContribution: customContribution
        })
      });

      if (response.ok) {
        const insuranceStorageKey = `pendingInsurances_${user.id}`;
        localStorage.removeItem(insuranceStorageKey);
        
        const userResponse = await fetch('/api/dashboard/user', {
          credentials: 'include'
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          localStorage.setItem('user', JSON.stringify(userData.user));
        }
        
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors de la sauvegarde.');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
                {/* <Link href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors cursor-pointer">
                  Accueil
                </Link>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors cursor-pointer">
                  Dashboard
                </Link> */}
              </nav>
            </div>
            <div className="text-sm text-gray-500">
              Configuration de{user.firstName} {user.lastName}
            </div>
          </div>
        </div>
      </header>

      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Configuration de vos assurances</h1>
            <p className="text-xl text-gray-600">
              Ajoutez vos assurances pour commencer le suivi intelligent
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8">
            {/* Étape 1 */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Ajoutez vos assurances</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type d'assurance
                    </label>
                    <select
                      value={currentInsurance.type}
                      onChange={(e) => handleInsuranceChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-8"
                    >
                      <option value="">Sélectionnez le type</option>
                      {insuranceTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marque du véhicule
                    </label>
                    <input
                      type="text"
                      value={currentInsurance.vehicleBrand || ''}
                      onChange={(e) => handleInsuranceChange('vehicleBrand', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Ex: Toyota"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modèle du véhicule
                    </label>
                    <input
                      type="text"
                      value={currentInsurance.vehicleModel}
                      onChange={(e) => handleInsuranceChange('vehicleModel', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Ex: Corolla"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Année du véhicule
                    </label>
                    <input
                      type="number"
                      value={currentInsurance.vehicleYear}
                      onChange={(e) => handleInsuranceChange('vehicleYear', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="2020"
                      min="2000"
                      max="2026"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date d'expiration
                    </label>
                    <input
                      type="date"
                      value={currentInsurance.expirationDate}
                      onChange={(e) => handleInsuranceChange('expirationDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {currentInsurance.estimatedCost > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <i className="ri-calculator-line text-blue-600 mr-2"></i>
                      <span className="text-sm font-medium text-blue-800">
                        Coût estimé: {currentInsurance.estimatedCost.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={addInsurance}
                  disabled={!currentInsurance.type || !currentInsurance.expirationDate}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  Ajouter cette assurance
                </button>

                {insurances.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Assurances ajoutées</h3>
                    <div className="space-y-3">
                      {insurances.map((insurance, index) => {
                        const typeLabel = insuranceTypes.find((t) => t.value === insurance.type)?.label || insurance.type;
                        return (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-800">{typeLabel}</p>
                              <p className="text-sm text-gray-600">
                                {insurance.vehicleModel} ({insurance.vehicleYear}) - Expire le {new Date(insurance.expirationDate).toLocaleDateString('fr-FR')}
                              </p>
                              <p className="text-sm font-medium text-green-600">
                                {insurance.estimatedCost.toLocaleString()} FCFA
                              </p>
                            </div>
                            <button
                              onClick={() => removeInsurance(index)}
                              className="text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              <i className="ri-delete-bin-line text-xl"></i>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">Total estimé:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {totalEstimated.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">Cotisation mensuelle suggérée:</span>
                        <span className="text-lg font-semibold text-blue-600">
                          {suggestedContribution.toLocaleString()} FCFA/mois
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setStep(2)}
                      className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 mt-6 cursor-pointer whitespace-nowrap"
                    >
                      Continuer vers les paramètres de cotisation
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Étape 2 */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuration des cotisations et paiements</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-blue-800 mb-4">Résumé de vos assurances</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Nombre d'assurances:</span>
                        <span className="font-semibold">{insurances.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Coût total annuel:</span>
                        <span className="font-semibold">{totalEstimated.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Cotisation suggérée:</span>
                        <span className="font-semibold">{suggestedContribution.toLocaleString()} FCFA/mois</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-green-800 mb-4">Choisissez votre mode de paiement</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input 
                          type="radio" 
                          id="yas" 
                          name="payment" 
                          value="yas"
                          checked={selectedPaymentMethod === 'yas'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="cursor-pointer" 
                        />
                        <label htmlFor="yas" className="cursor-pointer">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-bold">Y</span>
                            </div>
                            <span className="font-medium">YAS Money</span>
                          </div>
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input 
                          type="radio" 
                          id="flooz" 
                          name="payment" 
                          value="flooz"
                          checked={selectedPaymentMethod === 'flooz'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="cursor-pointer" 
                        />
                        <label htmlFor="flooz" className="cursor-pointer">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-bold">F</span>
                            </div>
                            <span className="font-medium">Flooz</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex">
                      <i className="ri-error-warning-line text-red-600 mr-3 mt-1"></i>
                      <div>
                        <h4 className="text-red-800 font-medium mb-1">Erreur</h4>
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                  <div className="flex">
                    <i className="ri-lightbulb-line text-yellow-600 mr-3 mt-1"></i>
                    <div>
                      <h4 className="text-yellow-800 font-medium mb-2">Conseils d'épargne</h4>
                      <ul className="text-yellow-700 text-sm space-y-1">
                        <li>• Cotisez régulièrement pour éviter les stress de dernière minute</li>
                        <li>• Vous pouvez ajuster le montant à tout moment selon vos revenus</li>
                        <li>• Les alertes vous préviendront automatiquement</li>
                        <li>• Votre argent reste disponible pour d'autres urgences si nécessaire</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 cursor-pointer whitespace-nowrap"
                  >
                    Retour
                  </button>
        <button
  onClick={handleComplete}
  disabled={isSubmitting}
  className={`flex-1 px-6 py-3 rounded-lg cursor-pointer whitespace-nowrap text-center ${isSubmitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white`}
>
  {isSubmitting ? (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
      Enregistrement...
    </div>
  ) : (
    'Confirmer'
  )}
</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
