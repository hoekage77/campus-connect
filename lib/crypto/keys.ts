/**
 * Key Generation & Derivation
 * 
 * Handles identity keypair generation, password-based key derivation,
 * and key fingerprint generation.
 */

import { getSodium } from './sodium'

// ============================================================================
// Types
// ============================================================================

export interface IdentityKeyPair {
  publicKey: Uint8Array   // 32 bytes - X25519 public key
  privateKey: Uint8Array  // 32 bytes - X25519 private key
}

export interface SerializedKeyPair {
  publicKey: string   // Base64
  privateKey: string  // Base64
}

export interface EncryptedPrivateKey {
  ciphertext: string  // Base64
  nonce: string       // Base64
  salt: string        // Base64 (for Argon2)
}

// ============================================================================
// Identity Keypair
// ============================================================================

/**
 * Generate a new X25519 identity keypair for key exchange.
 * The private key should be encrypted before storage.
 */
export function generateIdentityKeyPair(): IdentityKeyPair {
  const sodium = getSodium()
  const keypair = sodium.crypto_box_keypair()
  
  return {
    publicKey: keypair.publicKey,
    privateKey: keypair.privateKey,
  }
}

/**
 * Generate a key fingerprint for verification.
 * Users can compare fingerprints to verify they have the correct public key.
 */
export function getKeyFingerprint(publicKey: Uint8Array): string {
  const sodium = getSodium()
  // Hash the public key and take first 8 bytes
  const hash = sodium.crypto_generichash(8, publicKey)
  // Convert to hex with colons for readability: AB:CD:EF:12:34:56:78:9A
  return Array.from(hash)
    .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
    .join(':')
}

// ============================================================================
// Password-Based Key Derivation
// ============================================================================

/**
 * Derive an encryption key from a password using Argon2id.
 * Used to encrypt the private key for local storage.
 */
export async function deriveKeyFromPassword(
  password: string,
  salt?: Uint8Array
): Promise<{ key: Uint8Array; salt: Uint8Array }> {
  const sodium = getSodium()
  
  // Generate salt if not provided
  const actualSalt = salt || sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES)
  
  // Derive key using Argon2id (memory-hard, resistant to GPU attacks)
  const key = sodium.crypto_pwhash(
    sodium.crypto_secretbox_KEYBYTES,  // 32 bytes
    password,
    actualSalt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,  // CPU cost
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,  // Memory cost (64MB)
    sodium.crypto_pwhash_ALG_ARGON2ID13         // Algorithm
  )
  
  return { key, salt: actualSalt }
}

// ============================================================================
// Private Key Encryption (for storage)
// ============================================================================

/**
 * Encrypt the private key for secure storage.
 * Uses XChaCha20-Poly1305 with a password-derived key.
 */
export async function encryptPrivateKey(
  privateKey: Uint8Array,
  password: string
): Promise<EncryptedPrivateKey> {
  const sodium = getSodium()
  
  // Derive encryption key from password
  const { key, salt } = await deriveKeyFromPassword(password)
  
  // Generate random nonce
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
  
  // Encrypt private key
  const ciphertext = sodium.crypto_secretbox_easy(privateKey, nonce, key)
  
  // Clear sensitive data from memory
  sodium.memzero(key)
  
  return {
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
    salt: sodium.to_base64(salt),
  }
}

/**
 * Decrypt the private key from storage.
 */
export async function decryptPrivateKey(
  encrypted: EncryptedPrivateKey,
  password: string
): Promise<Uint8Array> {
  const sodium = getSodium()
  
  // Decode from base64
  const ciphertext = sodium.from_base64(encrypted.ciphertext)
  const nonce = sodium.from_base64(encrypted.nonce)
  const salt = sodium.from_base64(encrypted.salt)
  
  // Derive the same key from password
  const { key } = await deriveKeyFromPassword(password, salt)
  
  try {
    // Decrypt private key
    const privateKey = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key)
    
    // Clear sensitive data
    sodium.memzero(key)
    
    return privateKey
  } catch (error) {
    // Clear sensitive data
    sodium.memzero(key)
    throw new Error('Failed to decrypt private key. Wrong password?')
  }
}

// ============================================================================
// Serialization Helpers
// ============================================================================

/**
 * Serialize a keypair to base64 strings (for transmission/storage)
 */
export function serializeKeyPair(keypair: IdentityKeyPair): SerializedKeyPair {
  const sodium = getSodium()
  return {
    publicKey: sodium.to_base64(keypair.publicKey),
    privateKey: sodium.to_base64(keypair.privateKey),
  }
}

/**
 * Deserialize a keypair from base64 strings
 */
export function deserializeKeyPair(serialized: SerializedKeyPair): IdentityKeyPair {
  const sodium = getSodium()
  return {
    publicKey: sodium.from_base64(serialized.publicKey),
    privateKey: sodium.from_base64(serialized.privateKey),
  }
}

/**
 * Convert public key to base64 string
 */
export function publicKeyToBase64(publicKey: Uint8Array): string {
  const sodium = getSodium()
  return sodium.to_base64(publicKey)
}

/**
 * Convert base64 string to public key
 */
export function base64ToPublicKey(base64: string): Uint8Array {
  const sodium = getSodium()
  return sodium.from_base64(base64)
}
