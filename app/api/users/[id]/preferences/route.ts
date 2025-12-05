import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { getUserIdFromRequest } from '@/lib/auth';
import { PreferencesService } from '@/services';

type RouteContext = { params: Promise<{ id: string }>; };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    
    // Try PreferencesService first, fallback to dataStore
    try {
      const prefs = await PreferencesService.getPreferences(id);
      return NextResponse.json(prefs);
    } catch {
      const prefs = dataStore.getUserPreferences(id);
      return NextResponse.json(prefs || null);
    }
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = getUserIdFromRequest(request);
    if (!userId || userId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await request.json();
    const prefs = dataStore.createOrUpdatePreferences({ userId: id, ...body });
    return NextResponse.json(prefs);
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = getUserIdFromRequest(request);
    if (!userId || userId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await request.json();
    
    // Try PreferencesService first, fallback to dataStore
    try {
      const updated = await PreferencesService.updatePreferences(id, body);
      return NextResponse.json(updated);
    } catch {
      const prefs = dataStore.createOrUpdatePreferences({ userId: id, ...body });
      return NextResponse.json(prefs);
    }
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
