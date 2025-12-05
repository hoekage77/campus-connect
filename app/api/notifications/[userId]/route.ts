import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';

type RouteContext = { params: Promise<{ userId: string }>; };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { userId } = await context.params;
    const notifs = dataStore.getUserNotifications(userId);
    return NextResponse.json(notifs);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { userId } = await context.params;
    const body = await request.json();
    const { notificationId, action } = body;
    if (action === 'mark-as-read') {
      dataStore.markNotificationAsRead(userId, notificationId);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
