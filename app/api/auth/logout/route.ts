// POST /api/auth/logout - Clear session

import { NextResponse } from 'next/server';

export async function POST() {
  // For now, logout is handled client-side by clearing localStorage
  // In production with real auth, you'd clear HTTP-only cookies here
  return NextResponse.json({ success: true });
}
