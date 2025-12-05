import { NextResponse } from 'next/server';
export const runtime = 'nodejs'
import { NotificationService } from '@/services';
import { createGroupSchema } from '@/lib/validations';
import { getUserIdFromRequest } from '@/lib/auth';
import { getSupabaseRepository } from '@/lib/supabase/repository';

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (process.env.NODE_ENV === 'development') console.debug('[Groups API] Resolved userId:', userId)
    const repo = getSupabaseRepository();

    // Get public groups
    const publicGroups = await repo.getPublicGroups();

    if (!userId) {
      // No user context: return public groups only
      return NextResponse.json(publicGroups);
    }

    // Include groups the user belongs to (owner or member), regardless of privacy
    const myGroups = await repo.getUserGroups(userId);

    // Merge and de-duplicate by id
    const mergedMap = new Map<string, typeof publicGroups[number] & { isMember?: boolean }>();
    
    for (const g of publicGroups) {
      mergedMap.set(g.id, { ...g, isMember: g.ownerId === userId });
    }
    
    for (const g of myGroups) {
      mergedMap.set(g.id, { ...g, isMember: true });
    }

    const result = Array.from(mergedMap.values());
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    console.log('[Groups API POST] userId from request:', userId);
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('[Groups API POST] Invalid userId:', userId);
      return NextResponse.json(
        { error: 'Authentication required - valid user ID not found' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    console.log('[Groups API POST] Request body:', body);
    const validatedData = createGroupSchema.parse(body);
    
    const repo = getSupabaseRepository();
    
    // Create group (automatically adds owner as member)
    console.log('[Groups API POST] Creating group with ownerId:', userId);
    const group = await repo.createGroup({
      ownerId: userId,
      ...validatedData,
    });
    
    // Notify creator
    try {
      await NotificationService.createNotification(
        userId,
        'message',
        'Squad Created',
        `Your squad "${group.title}" is live!`,
        `/groups/${group.id}`,
        group.id
      );
    } catch (notifyErr) {
      console.error('[Groups POST] Failed to create creation notification', notifyErr);
    }

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    
    // Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
