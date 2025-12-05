/**
 * Sodium Initialization
 * 
 * libsodium must be initialized before use. This module handles
 * async initialization and provides a ready check.
 */

import _sodium from 'libsodium-wrappers'

let isReady = false
let initPromise: Promise<void> | null = null

/**
 * Initialize libsodium. Safe to call multiple times.
 * Must be called before any crypto operations.
 */
export async function initSodium(): Promise<typeof _sodium> {
  if (isReady) {
    return _sodium
  }

  if (!initPromise) {
    initPromise = _sodium.ready.then(() => {
      isReady = true
      console.log('[Crypto] libsodium initialized')
    })
  }

  await initPromise
  return _sodium
}

/**
 * Get the sodium instance. Throws if not initialized.
 */
export function getSodium(): typeof _sodium {
  if (!isReady) {
    throw new Error('[Crypto] libsodium not initialized. Call initSodium() first.')
  }
  return _sodium
}

/**
 * Check if libsodium is ready
 */
export function isSodiumReady(): boolean {
  return isReady
}

export type Sodium = typeof _sodium
