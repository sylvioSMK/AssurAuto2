'use client';

import { useState, useEffect } from 'react';
import { Insurance } from '@/types/dashboard';

interface ContributionMonthsDisplayProps {
  user: {
    id: string;
    totalBalance: number;
    monthlyContribution: number;
  };
  insurances: Insurance[];
}

export default function ContributionMonthsDisplay({ user, insurances }: ContributionMonthsDisplayProps) {
  const [monthsNeeded, setMonthsNeeded] = useState<number>(0);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchContributionStatus();
  }, [user, insurances]);

  const fetchContributionStatus = async () => {
    try {
      const response = await fetch(`/api/dashboard/contribution-status?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setMonthsNeeded(data.monthsNeeded);
        setCurrentProgress(data.progress);
      }
    } catch (error) {
      console.error('Error fetching contribution status:', error);
      // Fallback to local calculation
      calculateMonthsAndProgress();
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthsAndProgress = () => {
    if (!user || !insurances || insurances.length === 0) {
      setMonthsNeeded(0);
      setCurrentProgress(0);
      return;
    }

    // Calculate total goal (sum of all insurance estimated costs)
    const totalGoal = insurances.reduce((sum, insurance) => sum + insurance.estimatedCost, 0);
    
    // Calculate remaining amount needed
    const remainingAmount = Math.max(0, totalGoal - user.totalBalance);
    
    // Calculate months needed based on monthly contribution
    const months = user.monthlyContribution > 0 ? Math.ceil(remainingAmount / user.monthlyContribution) : 0;
    
    // Calculate progress percentage
    const progress = totalGoal > 0 ? Math.min((user.totalBalance / totalGoal) * 100, 100) : 0;

    setMonthsNeeded(months);
    setCurrentProgress(progress);
  };

  const getProgressColor = () => {
    if (currentProgress >= 80) return 'bg-green-500';
    if (currentProgress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusMessage = () => {
    if (monthsNeeded === 0) {
      return currentProgress >= 100 ? "Objectif atteint! 🎉" : "Configuration en cours...";
    }
    return `${monthsNeeded} mois restants`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <i className="ri-calendar-todo-line mr-2 text-blue-600"></i>
          Progression vers l'objectif
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          monthsNeeded === 0 && currentProgress >= 100 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {getStatusMessage()}
        </span>
      </div>

      {monthsNeeded > 0 && (
        <>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progression</span>
              <span>{Math.round(currentProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
                style={{ width: `${currentProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-600">Mois restants</p>
              <p className="text-2xl font-bold text-blue-600">{monthsNeeded}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-600">Cotisation/mois</p>
              <p className="text-2xl font-bold text-green-600">
                {user.monthlyContribution?.toLocaleString()} FCFA
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <i className="ri-information-line mr-1"></i>
              Continuez à cotiser {user.monthlyContribution?.toLocaleString()} FCFA par mois pour atteindre votre objectif.
            </p>
          </div>
        </>
      )}

      {monthsNeeded === 0 && currentProgress < 100 && (
        <div className="text-center py-8">
          <i className="ri-settings-line text-4xl text-gray-400 mb-2"></i>
          <p className="text-gray-600">Configurez vos assurances pour voir votre progression</p>
        </div>
      )}

      {monthsNeeded === 0 && currentProgress >= 100 && (
        <div className="text-center py-8">
          <i className="ri-check-circle-line text-4xl text-green-500 mb-2"></i>
          <p className="text-green-600 font-semibold">Félicitations! Vous avez atteint votre objectif d'épargne!</p>
        </div>
      )}
    </div>
  );
}
