// GET /api/sessions/[id] - Get single session by ID
// PATCH /api/sessions/[id] - Update session

import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { updateSessionSchema } from '@/lib/validations';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const session = dataStore.getSession(id);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Include RSVP counts and list
    const rsvps = dataStore.getSessionRSVPs(id);
    
    return NextResponse.json({
      ...session,
      attendeeCount: rsvps.filter(r => r.status === 'yes').length,
      maybeCount: rsvps.filter(r => r.status === 'maybe').length,
      rsvps,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    // TODO: Get userId from session and verify host
    const userId = 'user-1';
    
    const { id } = await context.params;
    const session = dataStore.getSession(id);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Verify host
    if (session.hostId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = updateSessionSchema.parse(body);
    
    // Convert date strings if provided
    const updates: any = { ...validatedData };
    if (validatedData.startAt) {
      updates.startAt = new Date(validatedData.startAt);
    }
    if (validatedData.endAt) {
      updates.endAt = new Date(validatedData.endAt);
    }
    
    const updated = dataStore.updateSession(id, updates);
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating session:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
