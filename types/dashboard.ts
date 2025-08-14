export interface Insurance {
  id: string;
  type: string;
  vehicleModel: string;
  vehicleYear: string;
  expirationDate: string;
  estimatedCost: number;
  status: 'active' | 'expiring_soon' | 'expired';
  daysUntilExpiry: number;
}

export interface User {
  id: string; // Prisma cuid() est un string
  firstName: string;
  lastName: string;
  email: string;
  totalBalance: number;
  monthlyContribution: number;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  insuranceId?: string;
}
