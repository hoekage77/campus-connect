// GET /api/messages - List messages for a group or session
// POST /api/messages - Send a message

import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { createMessageSchema } from '@/lib/validations';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const sessionId = searchParams.get('sessionId');
    
    if (!groupId && !sessionId) {
      return NextResponse.json(
        { error: 'groupId or sessionId required' },
        { status: 400 }
      );
    }
    
    let messages;
    if (groupId) {
      messages = dataStore.getGroupMessages(groupId);
    } else {
      messages = dataStore.getSessionMessages(sessionId!);
    }
    
    // TODO: Filter messages based on membership/access
    
    // Enrich messages with sender name and level
    const enriched = messages.map((m: any) => {
      const user = dataStore.getUser(m.senderId);
      const level = dataStore.getUserLevel(m.senderId);
      return {
        ...m,
        senderName: user?.name,
        senderLevel: level?.currentLevel,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
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
    const validatedData = createMessageSchema.parse(body);
    
    // Verify membership
    if (validatedData.groupId) {
      const members = dataStore.getGroupMembers(validatedData.groupId);
      const isMember = members.some(m => m.userId === userId);
      if (!isMember) {
        return NextResponse.json(
          { error: 'Must be a group member to send messages' },
          { status: 403 }
        );
      }
    }
    
    if (validatedData.sessionId) {
      // For sessions, could check RSVP status
      const session = dataStore.getSession(validatedData.sessionId);
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
    }
    
    const message = dataStore.createMessage({
      ...validatedData,
      senderId: userId,
      attachmentIds: [], // No attachments in Phase 1
    });
    const sender = dataStore.getUser(userId);
    const senderLevel = dataStore.getUserLevel(userId);
    const enriched = { ...message, senderName: sender?.name, senderLevel: senderLevel?.currentLevel };
    return NextResponse.json(enriched, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
