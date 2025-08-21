import { prisma } from '@/lib/prisma';
import { SMSService } from '@/lib/smsService';

export class ContributionChecker {
  private static instance: ContributionChecker;

  public static getInstance(): ContributionChecker {
    if (!ContributionChecker.instance) {
      ContributionChecker.instance = new ContributionChecker();
    }
    return ContributionChecker.instance;
  }

  /**
   * Check all users for missed contributions and send SMS notifications
   */
  async checkAllContributions() {
    try {
      console.log('Starting contribution check...');
      
      // Get all users with savings
      const users = await prisma.user.findMany({
        include: {
          userSavings: true,
          insurances: true
        }
      });

      let notificationsSent = 0;

      for (const user of users) {
        if (!user.userSavings || user.userSavings.monthlyContribution <= 0) {
          continue;
        }

        const shouldNotify = await this.shouldSendNotification(user.id);
        
        if (shouldNotify) {
          const smsService = SMSService.getInstance();
          const success = await smsService.sendMissedPaymentSMS(user.phone);
          
          if (success) {
            notificationsSent++;
            console.log(`SMS sent to user ${user.id} (${user.phone})`);
          }
        }
      }

      console.log(`Contribution check completed. ${notificationsSent} notifications sent.`);
      return notificationsSent;

    } catch (error) {
      console.error('Error checking contributions:', error);
      return 0;
    }
  }

  /**
   * Check if a specific user should receive a notification
   */
  private async shouldSendNotification(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userSavings: true
        }
      });

      if (!user || !user.userSavings || user.userSavings.monthlyContribution <= 0) {
        return false;
      }

      // Check if user has contributed this month
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const monthlyContribution = await prisma.transaction.count({
        where: {
          userId,
          type: 'contribution',
          dateCreated: {
            gte: startOfMonth
          }
        }
      });

      // Check if user has any active insurances
      const activeInsurances = await prisma.insurance.count({
        where: {
          userId,
          status: {
            in: ['active', 'expiring_soon']
          }
        }
      });

      // Send notification if no contribution this month and has active insurances
      return monthlyContribution === 0 && activeInsurances > 0;

    } catch (error) {
      console.error('Error checking user notification status:', error);
      return false;
    }
  }

  /**
   * Calculate months needed for a specific user to reach their goal
   */
  async calculateMonthsNeeded(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userSavings: true,
          insurances: true
        }
      });

      if (!user || !user.userSavings) {
        return {
          monthsNeeded: 0,
          totalGoal: 0,
          currentBalance: 0,
          remainingAmount: 0,
          progress: 0
        };
      }

      // Calculate total goal
      const totalGoal = user.insurances.reduce((sum, insurance) => sum + insurance.estimatedCost, 0);
      
      // Calculate remaining amount
      const currentBalance = user.userSavings.totalBalance || 0;
      const remainingAmount = Math.max(0, totalGoal - currentBalance);
      
      // Calculate months needed
      const monthlyContribution = user.userSavings.monthlyContribution || 0;
      const monthsNeeded = monthlyContribution > 0 ? Math.ceil(remainingAmount / monthlyContribution) : 0;

      return {
        monthsNeeded,
        totalGoal,
        currentBalance,
        remainingAmount,
        monthlyContribution,
        progress: totalGoal > 0 ? Math.min((currentBalance / totalGoal) * 100, 100) : 0
      };

    } catch (error) {
      console.error('Error calculating months needed:', error);
      return {
        monthsNeeded: 0,
        totalGoal: 0,
        currentBalance: 0,
        remainingAmount: 0,
        progress: 0
      };
    }
  }
}
