import { NextResponse } from 'next/server';
import { generateInsuranceExpirationAlerts, updateInsuranceStatuses } from '@/lib/alertService';

/**
 * API endpoint to generate insurance expiration alerts
 * This endpoint should be called periodically (e.g., daily) to check for upcoming expirations
 * and create alerts for users
 */
export async function POST() {
  try {
    // First update insurance statuses
    const statusUpdateResult = await updateInsuranceStatuses();
    
    if (!statusUpdateResult.success) {
      return NextResponse.json(
        { message: 'Failed to update insurance statuses', error: statusUpdateResult.error },
        { status: 500 }
      );
    }
    
    // Then generate alerts for upcoming expirations
    const result = await generateInsuranceExpirationAlerts();
    
    if (result.success) {
      return NextResponse.json({ 
        message: `Successfully generated ${result.alertsCreated} alerts`, 
        alertsCreated: result.alertsCreated 
      });
    } else {
      return NextResponse.json(
        { message: 'Failed to generate alerts', error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in generate alerts API:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
