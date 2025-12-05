// Utility to extract userId from request headers or cookies
// In production, this would validate JWT tokens or session cookies

export function getUserIdFromRequest(request: Request): string | null {
  // Try x-user-id header first (legacy / backward compatibility)
  const userIdHeader = request.headers.get('x-user-id')
  if (userIdHeader) return userIdHeader

  // If an Authorization Bearer token was provided, try to decode the JWT
  // and extract the 'sub' claim (Supabase user id). This is intentionally
  // implemented as a best-effort, unsigned decode for development convenience.
  // In production you should validate the token with Supabase server-side client
  const auth = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!auth) return null
  const parts = auth.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null
  const token = parts[1]
  try {
    const payloadBase64 = token.split('.')[1]
    if (!payloadBase64) return null
    // Decode base64 (url-safe) payload
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(base64, 'base64').toString('utf8')
    const obj = JSON.parse(json)
    // supabase sets 'sub' as the user id claim
    return (obj?.sub || obj?.user_id || null) as string | null
  } catch (err) {
    // decode error: fall back to null
    return null
  }
}

// Client-side utility to get current user from localStorage
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');

  if (!userId) return null;

  return { userId, userName, userEmail };
}

// Client-side utility to add auth headers to fetch requests
import { createClient } from './supabase/client'

export function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {}

  try {
    const supabase = createClient()
    // try to retrieve session token from supabase auth
    // getSession is async; we use getSessionSync if available, otherwise fall back to localStorage
    // The supabase-js client keeps its session in localStorage at key "supabase.auth.token" but using the official API is safer
    // For simplicity in client code, first try localStorage-based supabase auth token
  } catch (e) {
    // ignore
  }

  const userId = localStorage.getItem('userId')
  const auth = localStorage.getItem('supabase.auth.token')
  if (auth) {
    try {
      const parsed = JSON.parse(auth)
      const accessToken = parsed?.currentSession?.access_token || parsed?.currentSession?.access_token
      if (accessToken) {
        const headers: HeadersInit = { Authorization: `Bearer ${accessToken}` }
        if (userId && userId !== 'undefined' && userId !== 'null') {
          headers['x-user-id'] = userId
        }
        return headers
      }
    } catch (err) {
      // parsing error; fallback
    }
  }

  return (userId && userId !== 'undefined' && userId !== 'null') ? { 'x-user-id': userId } : {}
}

// Admin-specific helpers
export function getCurrentAdmin() {
  if (typeof window === 'undefined') return null;

  const adminId = localStorage.getItem('adminId');
  const adminName = localStorage.getItem('adminName');
  const adminEmail = localStorage.getItem('adminEmail');

  if (!adminId) return null;

  return { adminId, adminName, adminEmail };
}

export function getAdminAuthHeaders(): HeadersInit {
  const adminId = typeof window !== 'undefined' ? localStorage.getItem('adminId') : null;
  return adminId ? { 'x-user-id': adminId } : {};
}
