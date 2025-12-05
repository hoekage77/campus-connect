// POST /api/sessions/[id]/rsvps - Create or update RSVP

import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { createRSVPSchema } from '@/lib/validations';
import { getUserIdFromRequest } from '@/lib/auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id: sessionId } = await context.params;
    const session = dataStore.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const { status } = createRSVPSchema.parse(body);
    
    // Check capacity if status is 'yes'
    if (status === 'yes' && session.capacity) {
      const existingRSVPs = dataStore.getSessionRSVPs(sessionId);
      const yesCount = existingRSVPs.filter(r => r.status === 'yes' && r.userId !== userId).length;
      if (yesCount >= session.capacity) {
        return NextResponse.json(
          { error: 'Session is at capacity' },
          { status: 400 }
        );
      }
    }
    
    // Create or update RSVP
    const rsvp = dataStore.createOrUpdateRSVP({
      sessionId,
      userId,
      status,
    });

    // Notify session host
    try {
      const session = dataStore.getSession(sessionId)
      if (session && session.hostId !== userId) {
        await import('@/services').then(({ NotificationService }) =>
          NotificationService.createNotification(
            session.hostId,
            'event-reminder',
            'New RSVP',
            `A user has RSVP'd "${status}" to your session "${session.title}"`,
            `/sessions/${sessionId}`,
            sessionId
          )
        )
      }
    } catch (notifyErr) {
      console.warn('[RSVP] Notification error', notifyErr)
    }

    return NextResponse.json(rsvp, { status: 201 });
  } catch (error) {
    console.error('Error creating RSVP:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create RSVP' },
      { status: 500 }
    );
  }
}
