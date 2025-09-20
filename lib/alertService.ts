import { prisma } from '@/lib/prisma';

/**
 * Check all insurances and create alerts for those expiring soon
 * This function should be called periodically (e.g., daily)
 */
export async function generateInsuranceExpirationAlerts() {
  try {
    // Get all active insurances
    const activeInsurances = await prisma.insurance.findMany({
      where: {
        status: 'active'
      },
      include: {
        user: {
          include: {
            userSettings: true
          }
        },
        insuranceType: true,
        vehicle: true,
        alerts: true
      }
    });

    const today = new Date();
    let alertsCreated = 0;

    for (const insurance of activeInsurances) {
      const expirationDate = new Date(insurance.expirationDate);
      const timeDiff = expirationDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Get user's preferred alert days (default to 7)
      const alertDaysBefore = insurance.user.userSettings?.alertDaysBefore || 7;

      // Check if we need to create an alert
      // Create initial alert exactly alertDaysBefore days before expiration
      if (daysUntilExpiry === alertDaysBefore) {
        // Check if an alert already exists for this insurance
        const existingAlert = insurance.alerts.find(alert => 
          alert.type === 'expiry' && 
          !alert.isRead &&
          alert.alertDate <= new Date()
        );

        // If no existing alert, create one
        if (!existingAlert) {
          const message = `Votre assurance ${insurance.insuranceType.name} pour votre ${insurance.vehicle.model} expire dans ${daysUntilExpiry} jours.`;

          await prisma.alert.create({
            data: {
              userId: insurance.userId,
              insuranceId: insurance.id,
              type: 'expiry',
              title: 'Expiration d\'assurance',
              message,
              alertDate: new Date()
            }
          });
          
          alertsCreated++;
        }
      }
      // Create daily reminders for insurances expiring within the alert period
      else if (daysUntilExpiry < alertDaysBefore && daysUntilExpiry > 0) {
        // Check if a daily reminder already exists for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingDailyAlert = insurance.alerts.find(alert => {
          const alertDate = new Date(alert.alertDate);
          alertDate.setHours(0, 0, 0, 0);
          return alert.type === 'expiry' && 
                 !alert.isRead &&
                 alertDate.getTime() === today.getTime();
        });

        // If no daily reminder for today, create one
        if (!existingDailyAlert) {
          let message = '';
          if (daysUntilExpiry === 1) {
            message = `Votre assurance ${insurance.insuranceType.name} pour votre ${insurance.vehicle.model} expire demain!`;
          } else {
            message = `Votre assurance ${insurance.insuranceType.name} pour votre ${insurance.vehicle.model} expire dans ${daysUntilExpiry} jours.`;
          }

          await prisma.alert.create({
            data: {
              userId: insurance.userId,
              insuranceId: insurance.id,
              type: 'expiry',
              title: `Expiration dans ${daysUntilExpiry} jours`,
              message,
              alertDate: new Date()
            }
          });
          
          alertsCreated++;
        }
      } else if (daysUntilExpiry < 0) {
        // Insurance has expired, update status
        await prisma.insurance.update({
          where: { id: insurance.id },
          data: { status: 'expired' }
        });
      }
    }

    return { success: true, alertsCreated };
  } catch (error) {
    console.error('Error generating insurance expiration alerts:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update insurance statuses based on expiration dates
 */
export async function updateInsuranceStatuses() {
  try {
    const today = new Date();
    
    // Update expiring soon insurances
    await prisma.insurance.updateMany({
      where: {
        expirationDate: {
          lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Within 7 days
          gte: today
        },
        status: 'active'
      },
      data: {
        status: 'expiring_soon'
      }
    });
    
    // Update expired insurances
    await prisma.insurance.updateMany({
      where: {
        expirationDate: {
          lt: today
        },
        status: {
          in: ['active', 'expiring_soon']
        }
      },
      data: {
        status: 'expired'
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating insurance statuses:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate monthly payment reminders for users with auto-contribution enabled
 */
export async function generateMonthlyPaymentAlerts() {
  try {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let alertsCreated = 0;

    // Get all users with auto-contribution enabled
    const usersWithSavings = await prisma.userSavings.findMany({
      where: {
        autoContribution: true,
        monthlyContribution: {
          gt: 0 // Only users with a positive monthly contribution
        },
        isSuspended: false // Only for non-suspended savings
      },
      include: {
        user: {
          include: {
            alerts: {
              where: {
                type: 'payment_reminder',
                alertDate: {
                  gte: new Date(currentYear, currentMonth, 1), // Alerts from current month
                  lt: new Date(currentYear, currentMonth + 1, 1),
                },
              },
            },
          },
        },
      },
    });

    for (const userSavings of usersWithSavings) {
      const user = userSavings.user;
      const contributionDay = userSavings.contributionDay;
      const monthlyContribution = userSavings.monthlyContribution;

      // Determine the last day of the current month
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      // Check if today is the designated contribution day or the last day of the month if contributionDay is past month end
      const isContributionDay = today.getDate() === contributionDay ||
        (today.getDate() === lastDayOfMonth && contributionDay > lastDayOfMonth);

      // Check if an alert for the current month already exists
      const existingMonthlyAlert = user.alerts.some(alert => {
        const alertMonth = alert.alertDate.getMonth();
        const alertYear = alert.alertDate.getFullYear();
        return alertMonth === currentMonth && alertYear === currentYear;
      });

      if (isContributionDay && !existingMonthlyAlert) {
        const message = `N'oubliez pas votre cotisation mensuelle de ${monthlyContribution.toLocaleString()} FCFA pour ce mois.`;
        await prisma.alert.create({
          data: {
            userId: user.id,
            type: 'payment_reminder',
            title: 'Rappel de Cotisation Mensuelle',
            message,
            alertDate: today,
          },
        });
        alertsCreated++;
        // Update lastContributionDate to prevent duplicate alerts for this month
        await prisma.userSavings.update({
          where: { id: userSavings.id },
          data: { lastContributionDate: today },
        });
      }
    }
    return { success: true, alertsCreated };
  } catch (error) {
    console.error('Error generating monthly payment alerts:', error);
    return { success: false, error: (error as Error).message };
  }
}