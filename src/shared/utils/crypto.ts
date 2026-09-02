/**
 * WebCrypto utilities for Tu Chauchera.
 *
 * Implements:
 * - PBKDF2 key derivation from user-defined master password (100k iterations, SHA-256).
 * - AES-256-GCM authenticated encryption and decryption (with 96-bit random IV prepended).
 * - Sentinel creation and verification for fast master password validation.
 */

const PBKDF2_ITERATIONS = 100_000
const PBKDF2_HASH = "SHA-256"
const KEY_SALT = "tu-chauchera-v1"
const SENTINEL_MAGIC = "TU_CHAUCHERA_SENTINEL_VALID_V1"

/**
 * Derives a non-extractable AES-256-GCM CryptoKey from a user-provided master password.
 */
export async function deriveKeyFromPassword(masterPassword: string): Promise<CryptoKey> {
  if (!masterPassword || masterPassword.trim().length === 0) {
    throw new Error("Master password cannot be empty")
  }

  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"]
  )

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(KEY_SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false, // Non-extractable for memory safety
    ["encrypt", "decrypt"]
  )
}

/**
 * Encrypts arbitrary JSON-serializable data using AES-256-GCM.
 * Prepends a 12-byte (96-bit) random IV to the returned ArrayBuffer.
 */
export async function encryptData(key: CryptoKey, data: unknown): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(data))
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded)

  const result = new Uint8Array(iv.length + ciphertext.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(ciphertext), iv.length)
  return result.buffer
}

/**
 * Decrypts an ArrayBuffer containing a 12-byte IV followed by AES-256-GCM ciphertext.
 * Returns the parsed JSON payload.
 * Throws an error if decryption fails (wrong key or corrupted data).
 */
export async function decryptData<T>(key: CryptoKey, buffer: ArrayBuffer): Promise<T> {
  if (buffer.byteLength < 13) {
    throw new Error("Invalid encrypted buffer length")
  }

  const bytes = new Uint8Array(buffer)
  const iv = bytes.slice(0, 12)
  const ciphertext = bytes.slice(12)

  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext)
  return JSON.parse(new TextDecoder().decode(plaintext)) as T
}

/**
 * Creates an encrypted sentinel ArrayBuffer used to verify master passwords.
 */
export async function createPasswordSentinel(key: CryptoKey): Promise<ArrayBuffer> {
  return encryptData(key, { magic: SENTINEL_MAGIC, timestamp: Date.now() })
}

/**
 * Verifies if the given CryptoKey can correctly decrypt the sentinel.
 * Returns true if valid, false otherwise (e.g. wrong password).
 */
export async function verifyPasswordSentinel(
  key: CryptoKey,
  sentinelBuffer: ArrayBuffer
): Promise<boolean> {
  try {
    const payload = await decryptData<{ magic: string }>(key, sentinelBuffer)
    return payload.magic === SENTINEL_MAGIC
  } catch {
    return false
  }
}

/**
 * Helper to convert ArrayBuffer to Base64 string for JSON persistence.
 */
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0)
  }
  return btoa(binary)
}

/**
 * Helper to convert Base64 string back to ArrayBuffer.
 */
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
