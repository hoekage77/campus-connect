import { NextRequest, NextResponse } from 'next/server';
import { LevelService } from '@/services';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await req.json();
    const { type, points } = body;

    if (!type || !points) {
      return NextResponse.json(
        { error: 'type and points required' },
        { status: 400 }
      );
    }

    await LevelService.trackActivity(userId, type, points);

    const updated = await LevelService.getLevelStats(userId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('POST /api/users/[id]/activity:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to track activity' },
      { status: 500 }
    );
  }
}
