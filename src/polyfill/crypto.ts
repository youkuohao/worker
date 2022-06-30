import crypto from 'crypto'

if (!globalThis.crypto) {
  Object.assign(globalThis, {
    crypto: crypto.webcrypto,
  })
}

export { }
