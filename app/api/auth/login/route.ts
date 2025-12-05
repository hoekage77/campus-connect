// POST /api/auth/login - Authenticate user

import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Identifier and password are required' },
        { status: 400 }
      );
    }

    // Find user by identifier (email or student ID)
    const user = identifier.includes('@')
      ? dataStore.getUserByEmail(identifier.toLowerCase())
      : dataStore.getUserByStudentId(identifier.toUpperCase());
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = dataStore.verifyUserPassword(user.id, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      studentId: user.studentId,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
