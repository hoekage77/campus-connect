/**
 * Secure Key Storage (IndexedDB)
 * 
 * Stores encrypted private keys and cached group keys in IndexedDB.
 * Keys are encrypted with a password-derived key before storage.
 */

import type { EncryptedPrivateKey } from './keys'

// ============================================================================
// Types
// ============================================================================

export interface StoredIdentity {
  id: string                        // User ID
  publicKey: string                 // Base64
  encryptedPrivateKey: EncryptedPrivateKey
  fingerprint: string               // For verification
  createdAt: number                 // Timestamp
}

export interface CachedGroupKey {
  chatRoomId: string
  key: string                       // Base64 (in-memory only, cleared on lock)
  version: number
  cachedAt: number
}

// ============================================================================
// IndexedDB Setup
// ============================================================================

const DB_NAME = 'campus-connect-crypto'
const DB_VERSION = 1
const IDENTITY_STORE = 'identities'
const GROUP_KEYS_STORE = 'group-keys'

let db: IDBDatabase | null = null

/**
 * Open the IndexedDB database
 */
async function openDatabase(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open crypto database'))
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Store for encrypted identity keys
      if (!database.objectStoreNames.contains(IDENTITY_STORE)) {
        database.createObjectStore(IDENTITY_STORE, { keyPath: 'id' })
      }

      // Store for cached group keys (session only, cleared on lock)
      if (!database.objectStoreNames.contains(GROUP_KEYS_STORE)) {
        const store = database.createObjectStore(GROUP_KEYS_STORE, { keyPath: 'chatRoomId' })
        store.createIndex('chatRoomId', 'chatRoomId', { unique: true })
      }
    }
  })
}

// ============================================================================
// Identity Storage
// ============================================================================

/**
 * Store an encrypted identity
 */
export async function storeIdentity(identity: StoredIdentity): Promise<void> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IDENTITY_STORE, 'readwrite')
    const store = transaction.objectStore(IDENTITY_STORE)
    const request = store.put(identity)

    request.onerror = () => reject(new Error('Failed to store identity'))
    request.onsuccess = () => resolve()
  })
}

/**
 * Get stored identity by user ID
 */
export async function getStoredIdentity(userId: string): Promise<StoredIdentity | null> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IDENTITY_STORE, 'readonly')
    const store = transaction.objectStore(IDENTITY_STORE)
    const request = store.get(userId)

    request.onerror = () => reject(new Error('Failed to get identity'))
    request.onsuccess = () => resolve(request.result || null)
  })
}

/**
 * Delete stored identity
 */
export async function deleteStoredIdentity(userId: string): Promise<void> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IDENTITY_STORE, 'readwrite')
    const store = transaction.objectStore(IDENTITY_STORE)
    const request = store.delete(userId)

    request.onerror = () => reject(new Error('Failed to delete identity'))
    request.onsuccess = () => resolve()
  })
}

/**
 * Check if user has a stored identity
 */
export async function hasStoredIdentity(userId: string): Promise<boolean> {
  const identity = await getStoredIdentity(userId)
  return identity !== null
}

// ============================================================================
// Group Key Cache (Session Only)
// ============================================================================

// In-memory cache for decrypted group keys (cleared on lock)
const groupKeyCache = new Map<string, { key: Uint8Array; version: number }>()

/**
 * Cache a decrypted group key in memory
 */
export function cacheGroupKey(chatRoomId: string, key: Uint8Array, version: number): void {
  groupKeyCache.set(chatRoomId, { key, version })
}

/**
 * Get a cached group key
 */
export function getCachedGroupKey(chatRoomId: string): { key: Uint8Array; version: number } | null {
  return groupKeyCache.get(chatRoomId) || null
}

/**
 * Remove a cached group key
 */
export function removeCachedGroupKey(chatRoomId: string): void {
  const cached = groupKeyCache.get(chatRoomId)
  if (cached) {
    // Zero out the key before removing
    cached.key.fill(0)
    groupKeyCache.delete(chatRoomId)
  }
}

/**
 * Clear all cached group keys (call on lock/logout)
 */
export function clearGroupKeyCache(): void {
  for (const [_, cached] of groupKeyCache) {
    cached.key.fill(0)
  }
  groupKeyCache.clear()
}

// ============================================================================
// Full Clear (for logout)
// ============================================================================

/**
 * Clear all crypto data (for logout)
 */
export async function clearAllCryptoData(): Promise<void> {
  // Clear in-memory cache
  clearGroupKeyCache()

  // Clear IndexedDB
  const database = await openDatabase()

  await Promise.all([
    new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(IDENTITY_STORE, 'readwrite')
      const store = transaction.objectStore(IDENTITY_STORE)
      const request = store.clear()
      request.onerror = () => reject(new Error('Failed to clear identities'))
      request.onsuccess = () => resolve()
    }),
    new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(GROUP_KEYS_STORE, 'readwrite')
      const store = transaction.objectStore(GROUP_KEYS_STORE)
      const request = store.clear()
      request.onerror = () => reject(new Error('Failed to clear group keys'))
      request.onsuccess = () => resolve()
    }),
  ])
}

// ============================================================================
// Export/Import (Key Backup)
// ============================================================================

export interface KeyBackup {
  version: 1
  userId: string
  publicKey: string
  encryptedPrivateKey: EncryptedPrivateKey
  fingerprint: string
  exportedAt: number
}

/**
 * Export identity for backup
 */
export async function exportIdentity(userId: string): Promise<KeyBackup | null> {
  const identity = await getStoredIdentity(userId)
  if (!identity) return null

  return {
    version: 1,
    userId: identity.id,
    publicKey: identity.publicKey,
    encryptedPrivateKey: identity.encryptedPrivateKey,
    fingerprint: identity.fingerprint,
    exportedAt: Date.now(),
  }
}

/**
 * Import identity from backup
 */
export async function importIdentity(backup: KeyBackup): Promise<void> {
  const identity: StoredIdentity = {
    id: backup.userId,
    publicKey: backup.publicKey,
    encryptedPrivateKey: backup.encryptedPrivateKey,
    fingerprint: backup.fingerprint,
    createdAt: Date.now(),
  }

  await storeIdentity(identity)
}
