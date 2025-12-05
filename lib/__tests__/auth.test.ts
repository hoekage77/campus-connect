import { describe, it, expect } from 'vitest'
import { getUserIdFromRequest } from '../auth'

describe('getUserIdFromRequest', () => {
  it('returns null with no auth headers', () => {
    const req = new Request('http://localhost')
    const id = getUserIdFromRequest(req as any)
    expect(id).toBeNull()
  })

  it('decodes bearer token and extracts sub claim', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const payload = Buffer.from(JSON.stringify({ sub: 'test-user-123' })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const token = `${header}.${payload}.signature`
    const req = new Request('http://localhost', { headers: { authorization: `Bearer ${token}` } })
    const id = getUserIdFromRequest(req as any)
    expect(id).toBe('test-user-123')
  })
})

