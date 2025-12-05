/**
 * Simple event emitter for triggering data refetches across the app
 * Used when data is mutated (created, updated, deleted)
 */

type EventCallback = (data?: any) => void

const listeners: Record<string, EventCallback[]> = {
  'groups:created': [],
  'groups:updated': [],
  'groups:deleted': [],
  'user:joined-group': [],
  'user:left-group': [],
}

export function subscribe(event: keyof typeof listeners, callback: EventCallback) {
  if (!listeners[event]) {
    listeners[event] = []
  }
  listeners[event].push(callback)

  // Return unsubscribe function
  return () => {
    listeners[event] = listeners[event].filter((cb) => cb !== callback)
  }
}

export function emit(event: keyof typeof listeners, data?: any) {
  console.log(`[Event] ${event}`, data)
  if (listeners[event]) {
    listeners[event].forEach((callback) => callback(data))
  }
}

export const events = {
  groupCreated: (data: any) => emit('groups:created', data),
  groupUpdated: (data: any) => emit('groups:updated', data),
  groupDeleted: (data: any) => emit('groups:deleted', data),
  userJoinedGroup: (data: any) => emit('user:joined-group', data),
  userLeftGroup: (data: any) => emit('user:left-group', data),
}
