import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const levelData = dataStore.getUserLevel(userId);
    
    if (!levelData) {
      // Initialize level data if it doesn't exist
      dataStore.addActivityPoints(userId, 0, 'init');
      const initializedData = dataStore.getUserLevel(userId);
      
      if (!initializedData) {
        return NextResponse.json(
          { error: 'Unable to initialize user level data' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(initializedData);
    }

    // Calculate progress to next level
    const levelThresholds: Record<string, number> = {
      Novice: 100,
      Learner: 300,
      Collaborator: 700,
      Expert: 1500,
      Master: Number.POSITIVE_INFINITY,
    };

    const currentThreshold = levelThresholds[levelData.currentLevel] || 100;
    const nextLevel = levelData.currentLevel === 'Master' ? 'Master' : 
      (Object.keys(levelThresholds).find(level => levelThresholds[level] > currentThreshold) || 'Master');
    const nextThreshold = levelThresholds[nextLevel] || Number.POSITIVE_INFINITY;

    const progressToNext = Math.min(100, Math.max(0, (levelData.totalPoints - (currentThreshold > 100 ? currentThreshold - (currentThreshold - 100) : 0)) / (nextThreshold - currentThreshold) * 100));

    return NextResponse.json({
      ...levelData,
      progress: progressToNext,
      nextLevelThreshold: nextThreshold,
      nextLevel,
    });
  } catch (error) {
    console.error('GET /api/users/[id]/level/stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get level stats' },
      { status: 500 }
    );
  }
}
