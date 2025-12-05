import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { createSessionSchema } from '@/lib/validations';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const sessions = dataStore.getPublicSessions();
    
    // Include RSVP counts for each session
    const sessionsWithCounts = sessions.map(session => {
      const rsvps = dataStore.getSessionRSVPs(session.id);
      return {
        ...session,
        attendeeCount: rsvps.filter(r => r.status === 'yes').length,
        maybeCount: rsvps.filter(r => r.status === 'maybe').length,
      };
    });

    return NextResponse.json(sessionsWithCounts);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const validatedData = createSessionSchema.parse(body);
    
    // Convert ISO strings to Date objects
    const session = dataStore.createSession({
      ...validatedData,
      hostId: userId,
      startAt: new Date(validatedData.startAt),
      endAt: new Date(validatedData.endAt),
    });
    
    // If session is associated with a group, verify membership
    if (validatedData.groupId) {
      const members = dataStore.getGroupMembers(validatedData.groupId);
      const isMember = members.some(m => m.userId === userId);
      
      if (!isMember) {
        // Rollback - delete the session
        dataStore.deleteSession(session.id);
        return NextResponse.json(
          { error: 'Must be a group member to create group sessions' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
