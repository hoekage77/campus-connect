import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { getUserIdFromRequest } from '@/lib/auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const viewerId = getUserIdFromRequest(request)
    const { id } = await context.params
    const user = dataStore.getUser(id)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Determine visibility rules (hide email unless self or admin role)
    const isSelf = viewerId === user.id
    const viewer = viewerId ? dataStore.getUser(viewerId) : undefined
    const canSeeEmail = isSelf || viewer?.role === 'admin'

    // Collect squads membership summary
    const squads = user.squads
      .map((gid) => dataStore.getGroup(gid))
      .filter((g): g is NonNullable<typeof g> => Boolean(g))
      .map((g) => ({ id: g.id, title: g.title, privacy: g.privacy, memberCount: g.memberCount }))

    // Level data if exists
    const level = dataStore.getUserLevel(user.id)
    const levelInfo = level
      ? { currentLevel: level.currentLevel, totalPoints: level.totalPoints }
      : undefined

    const safe = {
      id: user.id,
      name: user.name,
      username: user.username,
      major: user.major,
      year: user.year,
      topics: user.topics ?? [],
      squads,
      level: levelInfo,
      ...(canSeeEmail && user.email ? { email: user.email } : {}),
    }

    return NextResponse.json(safe, { headers: { 'cache-control': 'no-store' } })
  } catch (err) {
    console.error('Failed to fetch user', err)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
