import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';

type RouteContext = { params: Promise<{ id: string }>; };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const level = dataStore.getUserLevel(id);
    return NextResponse.json(level || null);
  } catch (error) {
    console.error('Error fetching user level:', error);
    return NextResponse.json({ error: 'Failed to fetch user level' }, { status: 500 });
  }
}
