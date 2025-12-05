/**
 * useCrypto Hook
 * 
 * React hook for managing E2EE encryption state.
 * Handles initialization, setup, unlock, and lock operations.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  initSodium,
  isSodiumReady,
  generateIdentityKeyPair,
  getKeyFingerprint,
  encryptPrivateKey,
  decryptPrivateKey,
  publicKeyToBase64,
  base64ToPublicKey,
  storeIdentity,
  getStoredIdentity,
  hasStoredIdentity,
  clearGroupKeyCache,
  clearAllCryptoData,
  exportIdentity,
  importIdentity,
  type IdentityKeyPair,
  type StoredIdentity,
  type KeyBackup,
} from '@/lib/crypto'

// ============================================================================
// Types
// ============================================================================

export interface CryptoState {
  // Initialization state
  isInitialized: boolean
  isInitializing: boolean
  initError: Error | null

  // Key state
  hasKeys: boolean
  isUnlocked: boolean
  publicKey: string | null       // Base64
  fingerprint: string | null

  // Operations
  setupEncryption: (password: string) => Promise<void>
  unlock: (password: string) => Promise<void>
  lock: () => void
  deleteKeys: () => Promise<void>
  exportKeys: () => Promise<KeyBackup | null>
  importKeys: (backup: KeyBackup, password: string) => Promise<void>
  
  // Direct access to decrypted private key (use carefully!)
  getPrivateKey: () => Uint8Array | null
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCrypto(userId: string | null): CryptoState {
  // Initialization state
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [initError, setInitError] = useState<Error | null>(null)

  // Key state
  const [hasKeys, setHasKeys] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [fingerprint, setFingerprint] = useState<string | null>(null)

  // Decrypted private key (in memory only while unlocked)
  const privateKeyRef = useRef<Uint8Array | null>(null)

  // ============================================================================
  // Initialize libsodium
  // ============================================================================

  useEffect(() => {
    let mounted = true

    async function init() {
      if (isSodiumReady()) {
        setIsInitialized(true)
        return
      }

      setIsInitializing(true)
      try {
        await initSodium()
        if (mounted) {
          setIsInitialized(true)
          setInitError(null)
        }
      } catch (error) {
        if (mounted) {
          setInitError(error instanceof Error ? error : new Error('Failed to initialize crypto'))
        }
      } finally {
        if (mounted) {
          setIsInitializing(false)
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  // ============================================================================
  // Check for existing keys when userId changes
  // ============================================================================

  useEffect(() => {
    if (!isInitialized || !userId) {
      setHasKeys(false)
      setPublicKey(null)
      setFingerprint(null)
      return
    }

    async function checkKeys() {
      try {
        const exists = await hasStoredIdentity(userId!)
        setHasKeys(exists)

        if (exists) {
          const identity = await getStoredIdentity(userId!)
          if (identity) {
            setPublicKey(identity.publicKey)
            setFingerprint(identity.fingerprint)
          }
        }
      } catch (error) {
        console.error('[useCrypto] Failed to check for keys:', error)
      }
    }

    checkKeys()
  }, [isInitialized, userId])

  // ============================================================================
  // Setup Encryption (First Time)
  // ============================================================================

  const setupEncryption = useCallback(async (password: string) => {
    if (!isInitialized) {
      throw new Error('Crypto not initialized')
    }
    if (!userId) {
      throw new Error('User ID required')
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    // Generate new identity keypair
    const keypair = generateIdentityKeyPair()
    const pubKeyBase64 = publicKeyToBase64(keypair.publicKey)
    const fp = getKeyFingerprint(keypair.publicKey)

    // Encrypt private key for storage
    const encryptedPrivateKey = await encryptPrivateKey(keypair.privateKey, password)

    // Store in IndexedDB
    const identity: StoredIdentity = {
      id: userId,
      publicKey: pubKeyBase64,
      encryptedPrivateKey,
      fingerprint: fp,
      createdAt: Date.now(),
    }
    await storeIdentity(identity)

    // Update state
    setHasKeys(true)
    setPublicKey(pubKeyBase64)
    setFingerprint(fp)
    setIsUnlocked(true)
    privateKeyRef.current = keypair.privateKey

    // TODO: Upload public key to server
    console.log('[useCrypto] Encryption setup complete. Public key:', pubKeyBase64)
  }, [isInitialized, userId])

  // ============================================================================
  // Unlock (Returning User)
  // ============================================================================

  const unlock = useCallback(async (password: string) => {
    if (!isInitialized) {
      throw new Error('Crypto not initialized')
    }
    if (!userId) {
      throw new Error('User ID required')
    }
    if (!hasKeys) {
      throw new Error('No encryption keys found. Run setup first.')
    }

    const identity = await getStoredIdentity(userId)
    if (!identity) {
      throw new Error('Identity not found')
    }

    // Decrypt private key
    const privateKey = await decryptPrivateKey(identity.encryptedPrivateKey, password)

    // Store in memory
    privateKeyRef.current = privateKey
    setIsUnlocked(true)

    console.log('[useCrypto] Keys unlocked')
  }, [isInitialized, userId, hasKeys])

  // ============================================================================
  // Lock (Clear Keys from Memory)
  // ============================================================================

  const lock = useCallback(() => {
    // Clear private key from memory
    if (privateKeyRef.current) {
      privateKeyRef.current.fill(0)
      privateKeyRef.current = null
    }

    // Clear cached group keys
    clearGroupKeyCache()

    setIsUnlocked(false)
    console.log('[useCrypto] Keys locked')
  }, [])

  // ============================================================================
  // Delete Keys
  // ============================================================================

  const deleteKeys = useCallback(async () => {
    if (!userId) return

    // Lock first
    lock()

    // Clear all crypto data
    await clearAllCryptoData()

    // Reset state
    setHasKeys(false)
    setPublicKey(null)
    setFingerprint(null)

    console.log('[useCrypto] Keys deleted')
  }, [userId, lock])

  // ============================================================================
  // Export Keys (Backup)
  // ============================================================================

  const exportKeys = useCallback(async (): Promise<KeyBackup | null> => {
    if (!userId) return null
    return await exportIdentity(userId)
  }, [userId])

  // ============================================================================
  // Import Keys (Restore)
  // ============================================================================

  const importKeysCallback = useCallback(async (backup: KeyBackup, password: string) => {
    if (!isInitialized) {
      throw new Error('Crypto not initialized')
    }

    // Verify the backup can be decrypted
    await decryptPrivateKey(backup.encryptedPrivateKey, password)

    // Import to storage
    await importIdentity(backup)

    // Update state
    setHasKeys(true)
    setPublicKey(backup.publicKey)
    setFingerprint(backup.fingerprint)

    console.log('[useCrypto] Keys imported from backup')
  }, [isInitialized])

  // ============================================================================
  // Get Private Key (for encryption operations)
  // ============================================================================

  const getPrivateKey = useCallback((): Uint8Array | null => {
    return privateKeyRef.current
  }, [])

  // ============================================================================
  // Cleanup on unmount
  // ============================================================================

  useEffect(() => {
    return () => {
      // Clear private key from memory when component unmounts
      if (privateKeyRef.current) {
        privateKeyRef.current.fill(0)
        privateKeyRef.current = null
      }
    }
  }, [])

  return {
    isInitialized,
    isInitializing,
    initError,
    hasKeys,
    isUnlocked,
    publicKey,
    fingerprint,
    setupEncryption,
    unlock,
    lock,
    deleteKeys,
    exportKeys,
    importKeys: importKeysCallback,
    getPrivateKey,
  }
}

export default useCrypto
