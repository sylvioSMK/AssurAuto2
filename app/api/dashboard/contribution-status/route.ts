import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SMSService } from '@/lib/smsService';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user with savings and insurances
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSavings: true,
        insurances: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate total goal
    const totalGoal = user.insurances.reduce((sum, insurance) => sum + insurance.estimatedCost, 0);
    
    // Calculate remaining amount
    const currentBalance = user.userSavings?.totalBalance || 0;
    const remainingAmount = Math.max(0, totalGoal - currentBalance);
    
    // Calculate months needed
    const monthlyContribution = user.userSavings?.monthlyContribution || 0;
    const monthsNeeded = monthlyContribution > 0 ? Math.ceil(remainingAmount / monthlyContribution) : 0;

    return NextResponse.json({
      monthsNeeded,
      totalGoal,
      currentBalance,
      remainingAmount,
      monthlyContribution,
      progress: totalGoal > 0 ? Math.min((currentBalance / totalGoal) * 100, 100) : 0
    });

  } catch (error) {
    console.error('Error calculating contribution status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Endpoint to trigger SMS notifications
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSavings: true
      }
    });

    if (!user || !user.userSavings) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Send SMS notification
    const smsService = SMSService.getInstance();
    const success = await smsService.sendMissedPaymentSMS(user.phone);

    return NextResponse.json({ 
      success, 
      message: success ? 'SMS sent successfully' : 'Failed to send SMS' 
    });

  } catch (error) {
    console.error('Error sending SMS notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
