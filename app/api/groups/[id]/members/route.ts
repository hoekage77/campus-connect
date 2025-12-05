// POST /api/groups/[id]/members - Join group
// DELETE /api/groups/[id]/members - Leave group

import { NextResponse } from 'next/server';
export const runtime = 'nodejs'
import { dataStore } from '@/lib/data/store';
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
    
  const { id: groupId } = await context.params;
    const group = dataStore.getGroup(groupId);
    
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }
    
    // Check if already a member
    const existingMembers = dataStore.getGroupMembers(groupId);
    if (existingMembers.some(m => m.userId === userId)) {
      return NextResponse.json(
        { error: 'Already a member' },
        { status: 400 }
      );
    }
    
    // For invite-only/private groups, would need invitation check here
    if (group.privacy !== 'public') {
      return NextResponse.json(
        { error: 'This group requires an invitation' },
        { status: 403 }
      );
    }
    
    const member = dataStore.addGroupMember({
      groupId,
      userId,
      role: 'member',
    });

  // Emit group update via dataStore emitter
  const membersNow = dataStore.getGroupMembers(groupId);
  dataStore.emitEvent('groupMembers', { groupId, memberCount: membersNow.length, members: membersNow });
    
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
  const { id: groupId } = await context.params;
    const group = dataStore.getGroup(groupId);
    
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }
    
    // Check if member
    const members = dataStore.getGroupMembers(groupId);
    const member = members.find(m => m.userId === userId);
    
    if (!member) {
      return NextResponse.json(
        { error: 'Not a member' },
        { status: 400 }
      );
    }
    
    // Owners cannot leave their own group
    if (member.role === 'owner') {
      return NextResponse.json(
        { error: 'Owner cannot leave group. Delete the group instead.' },
        { status: 400 }
      );
    }
    
    dataStore.removeGroupMember(groupId, userId);
  // Emit group update via dataStore emitter on removal
  const membersNow = dataStore.getGroupMembers(groupId);
  dataStore.emitEvent('groupMembers', { groupId, memberCount: membersNow.length, members: membersNow });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json(
      { error: 'Failed to leave group' },
      { status: 500 }
    );
  }
}
