import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';

export async function POST() {
  try {
    dataStore.resetToDefaults();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to seed demo data:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
