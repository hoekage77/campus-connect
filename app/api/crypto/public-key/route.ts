/**
 * Public Keys API
 * 
 * GET /api/crypto/public-key - Get user's public key
 * POST /api/crypto/public-key - Upload user's public key
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRepository } from '@/lib/supabase/repository'
import { getUserIdFromRequest } from '@/lib/auth'

const repo = getSupabaseRepository()

// GET - Get a user's public key
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Get public key from database
    const data = await repo.getUserPublicKey(userId)

    if (!data) {
      return NextResponse.json({ error: 'Public key not found' }, { status: 404 })
    }

    return NextResponse.json({
      userId,
      publicKey: data.publicKey,
      keyId: data.keyId,
      createdAt: data.createdAt,
    })
  } catch (error) {
    console.error('[API] GET /api/crypto/public-key error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get public key' },
      { status: 500 }
    )
  }
}

// POST - Upload user's public key
export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { publicKey, keyId } = body

    if (!publicKey || !keyId) {
      return NextResponse.json(
        { error: 'publicKey and keyId required' },
        { status: 400 }
      )
    }

    // Upsert public key
    const result = await repo.upsertUserPublicKey(userId, publicKey, keyId)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] POST /api/crypto/public-key error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save public key' },
      { status: 500 }
    )
  }
}
