/**
 * Crypto Module - Main Exports
 * 
 * End-to-End Encryption for Campus Connect messaging.
 * 
 * Usage:
 * ```typescript
 * import { initSodium, generateIdentityKeyPair, encryptMessage } from '@/lib/crypto'
 * 
 * // Initialize (once at app start)
 * await initSodium()
 * 
 * // Generate keys
 * const keypair = generateIdentityKeyPair()
 * 
 * // Encrypt a message
 * const encrypted = encryptMessage('Hello!', groupKey)
 * ```
 */

// Initialization
export { initSodium, getSodium, isSodiumReady } from './sodium'

// Key Generation & Derivation
export {
  generateIdentityKeyPair,
  getKeyFingerprint,
  deriveKeyFromPassword,
  encryptPrivateKey,
  decryptPrivateKey,
  serializeKeyPair,
  deserializeKeyPair,
  publicKeyToBase64,
  base64ToPublicKey,
  type IdentityKeyPair,
  type SerializedKeyPair,
  type EncryptedPrivateKey,
} from './keys'

// Message Encryption
export {
  generateGroupKey,
  wrapGroupKey,
  unwrapGroupKey,
  sealGroupKey,
  unsealGroupKey,
  encryptMessage,
  decryptMessage,
  encryptAttachment,
  decryptAttachment,
  clearSensitiveData,
  constantTimeEqual,
  type EncryptedMessage,
  type WrappedKey,
} from './encryption'

// Storage
export {
  storeIdentity,
  getStoredIdentity,
  deleteStoredIdentity,
  hasStoredIdentity,
  cacheGroupKey,
  getCachedGroupKey,
  removeCachedGroupKey,
  clearGroupKeyCache,
  clearAllCryptoData,
  exportIdentity,
  importIdentity,
  type StoredIdentity,
  type CachedGroupKey,
  type KeyBackup,
} from './storage'
