/**
 * Vitest global test setup.
 * Runs before every test file.
 */
import '@testing-library/jest-dom'

// Node 24 provides a full WebCrypto implementation at globalThis.crypto
// jsdom should inherit it. This setup file ensures it's available.
// No polyfill needed for Node 24.
