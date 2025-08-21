import { prisma } from '@/lib/prisma';

interface SMSPayload {
  phoneNumber: string;
  message: string;
  type: 'welcome' | 'reminder' | 'missed_payment';
}

export class SMSService {
  private static instance: SMSService;

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  /**
   * Envoie un SMS via l'API mobile money
   */
  async sendSMS(payload: SMSPayload): Promise<boolean> {
    try {
      // Simulation de l'envoi SMS via l'API mobile money
      // Dans un environnement réel, ceci serait remplacé par l'appel réel à l'API
      console.log(`SMS envoyé à ${payload.phoneNumber}: ${payload.message}`);
      
      // Enregistrer l'envoi dans la base de données
      await prisma.smsLog.create({
        data: {
          phoneNumber: payload.phoneNumber,
          message: payload.message,
          type: payload.type,
          status: 'sent',
          sentAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du SMS:', error);
      
      // Enregistrer l'échec
      await prisma.smsLog.create({
        data: {
          phoneNumber: payload.phoneNumber,
          message: payload.message,
          type: payload.type,
          status: 'failed',
          error: (error as Error).message,
          sentAt: new Date()
        }
      });

      return false;
    }
  }

  /**
   * Envoie un SMS de bienvenue après l'ajout d'un service
   */
  async sendWelcomeSMS(phoneNumber: string, serviceName: string, monthlyAmount: number): Promise<boolean> {
    const message = `Cher client, votre service ${serviceName} a été ajouté avec succès. Votre cotisation mensuelle est de ${monthlyAmount.toLocaleString()} FCFA. Merci de cotiser rapidement pour sécuriser votre avenir.`;
    return this.sendSMS({
      phoneNumber,
      message,
      type: 'welcome'
    });
  }

  /**
   * Envoie un rappel de cotisation manquée
   */
  async sendMissedPaymentSMS(phoneNumber: string): Promise<boolean> {
    const message = "Cher boss vous n'aviez aucunement cotiser ce mois, nous vous attendons s'il vous plaît c'est pour votre bonheur";
    return this.sendSMS({
      phoneNumber,
      message,
      type: 'missed_payment'
    });
  }

  /**
   * Envoie un rappel général de cotisation
   */
  async sendReminderSMS(phoneNumber: string, amount: number): Promise<boolean> {
    const message = `Cher client, n'oubliez pas votre cotisation mensuelle de ${amount.toLocaleString()} FCFA. Votre avenir mérite d'être protégé.`;
    return this.sendSMS({
      phoneNumber,
      message,
      type: 'reminder'
    });
  }
}
