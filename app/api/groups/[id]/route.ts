// GET /api/groups/[id] - Get single group by ID
// PATCH /api/groups/[id] - Update group
// DELETE /api/groups/[id] - Delete group

import { NextResponse } from 'next/server';
export const runtime = 'nodejs'
import { getSupabaseRepository } from '@/lib/supabase/repository';
import { updateGroupSchema } from '@/lib/validations';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const repo = getSupabaseRepository();
    const group = await repo.getGroup(id);
    
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }
    
    // Include members with enriched user profile data
    const members = await repo.getGroupMembers(id);
    const enrichedMembers = await Promise.all(members.map(async m => {
      const user = await repo.getUser(m.userId);
      return {
        ...m,
        user: user ? { id: user.id, name: user.name, username: user.username, major: user.major, year: user.year, avatar: user.avatar } : null,
      };
    }));
    
    return NextResponse.json({
      ...group,
      members: enrichedMembers,
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    // TODO: Get userId from session and verify ownership
    const userId = 'user-1';
    
  const { id } = await context.params;
    const repo = getSupabaseRepository();
    const group = await repo.getGroup(id);
    
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (group.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = updateGroupSchema.parse(body);
    
    // TODO: Implement updateGroup in repository
    // const updated = await repo.updateGroup(id, validatedData);
    
    return NextResponse.json({ error: 'Update not implemented yet' }, { status: 501 });
  } catch (error) {
    console.error('Error updating group:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    // TODO: Get userId from session and verify ownership
    const userId = 'user-1';
    
  const { id } = await context.params;
    const repo = getSupabaseRepository();
    const group = await repo.getGroup(id);
    
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (group.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // TODO: Implement deleteGroup in repository
    // await repo.deleteGroup(id);
    
    return NextResponse.json({ error: 'Delete not implemented yet' }, { status: 501 });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
