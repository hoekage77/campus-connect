const DAILY_API_BASE = "https://api.daily.co/v1"

interface DailyRoomOptions {
  name?: string
  maxParticipants?: number
  enableVideo?: boolean
  enableScreenShare?: boolean
}

interface DailyRoom {
  name: string
  url: string
}

const hasApiKey = Boolean(process.env.DAILY_API_KEY)

function getHeaders() {
  if (!hasApiKey) return undefined
  return {
    Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

function generateMockRoom(name?: string): DailyRoom {
  const slug = name || `dev-space-${Date.now()}`
  const domain = process.env.DAILY_DOMAIN || "example.daily.co"
  return {
    name: slug,
    url: `https://${domain}/${slug}`,
  }
}

export async function createDailyRoom(options: DailyRoomOptions & { fallbackName: string }): Promise<DailyRoom> {
  if (!hasApiKey) {
    console.warn('[Daily] DAILY_API_KEY not configured. Using mock room URL.')
    return generateMockRoom(options.fallbackName)
  }

  const body = {
    name: options.name || options.fallbackName,
    privacy: 'private',
    properties: {
      max_participants: options.maxParticipants || 10,
      enable_screenshare: options.enableScreenShare ?? false,
      enable_chat: false,
      enable_recording: 'cloud',
      eject_at_room_exp: true,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12, // 12 hours
      start_audio_off: true,
      start_video_off: !(options.enableVideo ?? false),
    },
  }

  const response = await fetch(`${DAILY_API_BASE}/rooms`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    console.error('[Daily] Failed to create room', await response.text())
    throw new Error('Failed to provision Daily room')
  }

  const room = await response.json()
  return { name: room.name, url: room.url }
}

export async function deleteDailyRoom(roomName?: string): Promise<void> {
  if (!roomName) return
  if (!hasApiKey) return

  const response = await fetch(`${DAILY_API_BASE}/rooms/${roomName}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })

  if (!response.ok) {
    console.warn('[Daily] Failed to delete room', roomName, await response.text())
  }
}

export async function createDailyToken(roomName: string, options: { userId: string; userName?: string; isOwner?: boolean }) {
  if (!roomName) throw new Error('Missing Daily room name')
  if (!hasApiKey) {
    console.warn('[Daily] DAILY_API_KEY missing. Returning mock token.')
    return { token: `mock-token-${Date.now()}` }
  }

  const response = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: options.isOwner ?? false,
        user_id: options.userId,
        user_name: options.userName,
      },
    }),
  })

  if (!response.ok) {
    console.error('[Daily] Failed to create token', await response.text())
    throw new Error('Failed to create Daily access token')
  }

  return response.json()
}
