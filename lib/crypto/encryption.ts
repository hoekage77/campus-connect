/**
 * Message Encryption & Decryption
 * 
 * Handles symmetric encryption of messages using XChaCha20-Poly1305.
 * Also handles asymmetric key wrapping for group key distribution.
 */

import { getSodium } from './sodium'

// ============================================================================
// Types
// ============================================================================

export interface EncryptedMessage {
  ciphertext: string  // Base64 encoded
  nonce: string       // Base64 encoded (24 bytes for XChaCha20)
}

export interface WrappedKey {
  ciphertext: string  // Base64 encoded
  nonce: string       // Base64 encoded
}

// ============================================================================
// Group Key Management
// ============================================================================

/**
 * Generate a new random symmetric key for group encryption.
 */
export function generateGroupKey(): Uint8Array {
  const sodium = getSodium()
  return sodium.crypto_secretbox_keygen()
}

/**
 * Wrap (encrypt) a group key for a specific recipient using their public key.
 * Uses authenticated encryption (crypto_box).
 */
export function wrapGroupKey(
  groupKey: Uint8Array,
  recipientPublicKey: Uint8Array,
  senderPrivateKey: Uint8Array
): WrappedKey {
  const sodium = getSodium()
  
  // Generate random nonce
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)
  
  // Encrypt the group key for the recipient
  const ciphertext = sodium.crypto_box_easy(
    groupKey,
    nonce,
    recipientPublicKey,
    senderPrivateKey
  )
  
  return {
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
  }
}

/**
 * Unwrap (decrypt) a group key using recipient's private key.
 */
export function unwrapGroupKey(
  wrapped: WrappedKey,
  senderPublicKey: Uint8Array,
  recipientPrivateKey: Uint8Array
): Uint8Array {
  const sodium = getSodium()
  
  const ciphertext = sodium.from_base64(wrapped.ciphertext)
  const nonce = sodium.from_base64(wrapped.nonce)
  
  try {
    return sodium.crypto_box_open_easy(
      ciphertext,
      nonce,
      senderPublicKey,
      recipientPrivateKey
    )
  } catch (error) {
    throw new Error('Failed to unwrap group key. Invalid key or tampered data.')
  }
}

/**
 * Wrap a group key using sealed box (anonymous sender).
 * The recipient can decrypt without knowing who sent it.
 * Useful when the server distributes keys.
 */
export function sealGroupKey(
  groupKey: Uint8Array,
  recipientPublicKey: Uint8Array
): string {
  const sodium = getSodium()
  const sealed = sodium.crypto_box_seal(groupKey, recipientPublicKey)
  return sodium.to_base64(sealed)
}

/**
 * Unseal a group key (anonymous sender).
 */
export function unsealGroupKey(
  sealed: string,
  recipientPublicKey: Uint8Array,
  recipientPrivateKey: Uint8Array
): Uint8Array {
  const sodium = getSodium()
  const sealedBytes = sodium.from_base64(sealed)
  
  try {
    return sodium.crypto_box_seal_open(
      sealedBytes,
      recipientPublicKey,
      recipientPrivateKey
    )
  } catch (error) {
    throw new Error('Failed to unseal group key.')
  }
}

// ============================================================================
// Message Encryption (Symmetric)
// ============================================================================

/**
 * Encrypt a message using a group symmetric key.
 * Uses XChaCha20-Poly1305 (authenticated encryption).
 */
export function encryptMessage(
  plaintext: string,
  groupKey: Uint8Array
): EncryptedMessage {
  const sodium = getSodium()
  
  // Convert plaintext to bytes
  const plaintextBytes = sodium.from_string(plaintext)
  
  // Generate random nonce (24 bytes for XChaCha20)
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
  
  // Encrypt with authentication
  const ciphertext = sodium.crypto_secretbox_easy(plaintextBytes, nonce, groupKey)
  
  return {
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
  }
}

/**
 * Decrypt a message using a group symmetric key.
 */
export function decryptMessage(
  encrypted: EncryptedMessage,
  groupKey: Uint8Array
): string {
  const sodium = getSodium()
  
  const ciphertext = sodium.from_base64(encrypted.ciphertext)
  const nonce = sodium.from_base64(encrypted.nonce)
  
  try {
    const plaintextBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, groupKey)
    return sodium.to_string(plaintextBytes)
  } catch (error) {
    throw new Error('Failed to decrypt message. Invalid key or tampered data.')
  }
}

// ============================================================================
// Attachment Encryption
// ============================================================================

/**
 * Encrypt a file/attachment using a group key.
 * Returns encrypted bytes suitable for upload.
 */
export function encryptAttachment(
  data: Uint8Array,
  groupKey: Uint8Array
): { ciphertext: Uint8Array; nonce: Uint8Array } {
  const sodium = getSodium()
  
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
  const ciphertext = sodium.crypto_secretbox_easy(data, nonce, groupKey)
  
  return { ciphertext, nonce }
}

/**
 * Decrypt a file/attachment using a group key.
 */
export function decryptAttachment(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  groupKey: Uint8Array
): Uint8Array {
  const sodium = getSodium()
  
  try {
    return sodium.crypto_secretbox_open_easy(ciphertext, nonce, groupKey)
  } catch (error) {
    throw new Error('Failed to decrypt attachment.')
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Securely clear sensitive data from memory.
 * Call this after you're done with keys.
 */
export function clearSensitiveData(data: Uint8Array): void {
  const sodium = getSodium()
  sodium.memzero(data)
}

/**
 * Compare two keys in constant time (prevents timing attacks).
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const sodium = getSodium()
  if (a.length !== b.length) return false
  return sodium.memcmp(a, b)
}
