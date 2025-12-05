import { NextRequest, NextResponse } from 'next/server';
import { LevelService } from '@/services';

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const leaderboard = await LevelService.getLeaderboard(limit);
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('GET /api/leaderboard:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get leaderboard' },
      { status: 500 }
    );
  }
}
