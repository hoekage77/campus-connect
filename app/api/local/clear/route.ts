import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';

export async function POST() {
  try {
    dataStore.clearPersistedData();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear persisted data:', error);
    return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 });
  }
}
