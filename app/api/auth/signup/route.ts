// POST /api/auth/signup - Register new user

import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';

const STUDENT_ID_REGEX = /^[Aa]\d{8}$/;
const AUN_EMAIL_REGEX = /^[^\s@]+@aun\.edu\.ng$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const major = typeof body.major === 'string' ? body.major.trim() : undefined;
    const year = typeof body.year === 'string' ? body.year.trim() : undefined;
    const displayName = typeof body.name === 'string' ? body.name.trim() : username;

    // Validate required fields
    if (!username || !identifier || !password) {
      return NextResponse.json(
        { error: 'Username, identifier, and password are required' },
        { status: 400 }
      );
    }

    const isStudentId = STUDENT_ID_REGEX.test(identifier);
    const isAunEmail = AUN_EMAIL_REGEX.test(identifier);

    if (!isStudentId && !isAunEmail) {
      return NextResponse.json(
        { error: 'Provide a valid A00012345 ID or @aun.edu.ng email address' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = isAunEmail ? identifier.toLowerCase() : undefined;
    const normalizedStudentId = isStudentId ? identifier.toUpperCase() : undefined;

    if (normalizedEmail) {
      const existingByEmail = dataStore.getUserByEmail(normalizedEmail);
      if (existingByEmail) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }
    }

    if (normalizedStudentId) {
      const existingById = dataStore.getUserByStudentId(normalizedStudentId);
      if (existingById) {
        return NextResponse.json(
          { error: 'Student ID already registered' },
          { status: 409 }
        );
      }
    }

    // Create user (password stored in-memory for demo purposes only)
    const user = dataStore.createUser({
      username,
      name: displayName,
      email: normalizedEmail,
      studentId: normalizedStudentId,
      password,
      topics: [],
      major,
      year,
    });

    // Initialize user level data
    dataStore.addActivityPoints(user.id, 0, "init");
    dataStore.createOrUpdatePreferences({
      userId: user.id,
      interests: [],
      preferredEventTypes: [],
      notificationFrequency: "weekly",
      discoveryEnabled: true,
    });

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      studentId: user.studentId,
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    );
  }
}
