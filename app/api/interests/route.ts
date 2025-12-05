import { NextRequest, NextResponse } from 'next/server';

// List of available interests
const AVAILABLE_INTERESTS = [
  'Study Groups',
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Engineering',
  'Business',
  'Economics',
  'Psychology',
  'History',
  'Literature',
  'Arts',
  'Music',
  'Sports & Fitness',
  'Wellness',
  'Photography',
  'Gaming',
  'Social Events',
  'Career & Professional',
  'Networking',
  'Startup & Entrepreneurship',
  'Leadership',
  'Volunteering',
  'Environmental',
  'Technology',
  'AI & Machine Learning',
  'Web Development',
  'Mobile Development',
  'Data Science',
];

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(AVAILABLE_INTERESTS);
  } catch (error) {
    console.error('GET /api/interests:', error);
    return NextResponse.json(
      { error: 'Failed to get interests' },
      { status: 500 }
    );
  }
}
