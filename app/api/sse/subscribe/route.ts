import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');
  const userId = searchParams.get('userId');

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const ping = () => controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n'));

      const messageHandler = (payload: any) => {
        if (groupId && payload.groupId !== groupId) return;
        controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify(payload)}\n\n`));
      };

      const groupHandler = (payload: any) => {
        if (groupId && payload.groupId !== groupId) return;
        controller.enqueue(encoder.encode(`event: groupMembers\ndata: ${JSON.stringify(payload)}\n\n`));
      };

      const notifHandler = (payload: any) => {
        if (userId && payload.userId !== userId) return;
        controller.enqueue(encoder.encode(`event: notification\ndata: ${JSON.stringify(payload)}\n\n`));
      };

      dataStore.on('message', messageHandler);
      dataStore.on('groupMembers', groupHandler);
      dataStore.on('notification', notifHandler);

      const timer = setInterval(ping, 15000);

      request.signal.addEventListener('abort', () => {
        clearInterval(timer);
        dataStore.off('message', messageHandler);
        dataStore.off('groupMembers', groupHandler);
        dataStore.off('notification', notifHandler);
        controller.close();
      });
    }
  });

  return new NextResponse(stream, { headers });
}
