import { describe, it, expect } from "vitest"
import {
  deriveKeyFromPassword,
  encryptData,
  decryptData,
  createPasswordSentinel,
  verifyPasswordSentinel,
  bufferToBase64,
  base64ToBuffer,
} from "./crypto"

describe("crypto utils", () => {
  it("derives a non-extractable CryptoKey from master password", async () => {
    const key = await deriveKeyFromPassword("superSecretPassphrase123!")
    expect(key).toBeDefined()
    expect(key.type).toBe("secret")
    expect(key.extractable).toBe(false)
    expect(key.algorithm.name).toBe("AES-GCM")
  })

  it("throws when deriving key with empty password", async () => {
    await expect(deriveKeyFromPassword("")).rejects.toThrow("Master password cannot be empty")
  })

  it("encrypts and decrypts structured JSON data correctly (round-trip)", async () => {
    const key = await deriveKeyFromPassword("myMasterKey123")
    const testData = {
      id: "abc-123",
      amountCents: 450000,
      nested: { foo: "bar", active: true },
      items: [1, 2, 3],
    }

    const encrypted = await encryptData(key, testData)
    expect(encrypted.byteLength).toBeGreaterThan(12)

    const decrypted = await decryptData<typeof testData>(key, encrypted)
    expect(decrypted).toEqual(testData)
  })

  it("generates different ciphertexts for identical plaintext due to random IV", async () => {
    const key = await deriveKeyFromPassword("myMasterKey123")
    const data = { hello: "world" }

    const encrypted1 = new Uint8Array(await encryptData(key, data))
    const encrypted2 = new Uint8Array(await encryptData(key, data))

    // IVs (first 12 bytes) must differ
    const iv1 = encrypted1.slice(0, 12)
    const iv2 = encrypted2.slice(0, 12)
    expect(iv1).not.toEqual(iv2)
  })

  it("fails to decrypt with a different password/key", async () => {
    const key1 = await deriveKeyFromPassword("passwordOne123")
    const key2 = await deriveKeyFromPassword("passwordTwo456")

    const encrypted = await encryptData(key1, { secret: "data" })

    await expect(decryptData(key2, encrypted)).rejects.toThrow()
  })

  it("creates and verifies password sentinel successfully", async () => {
    const key = await deriveKeyFromPassword("validMasterPassword")
    const wrongKey = await deriveKeyFromPassword("invalidMasterPassword")

    const sentinel = await createPasswordSentinel(key)

    const isValid = await verifyPasswordSentinel(key, sentinel)
    expect(isValid).toBe(true)

    const isInvalid = await verifyPasswordSentinel(wrongKey, sentinel)
    expect(isInvalid).toBe(false)
  })

  it("converts ArrayBuffer to Base64 and back losslessly", () => {
    const raw = new Uint8Array([0, 15, 255, 128, 42, 99])
    const b64 = bufferToBase64(raw.buffer)
    const restored = new Uint8Array(base64ToBuffer(b64))

    expect(restored).toEqual(raw)
  })
})
