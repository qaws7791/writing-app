const SHA256_K = Uint32Array.from([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

const encoder = new TextEncoder()

export function hmacSha256Hex(key: string, message: string): string {
  return bytesToHex(hmacSha256(encoder.encode(key), encoder.encode(message)))
}

function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64
  let normalizedKey = key
  if (normalizedKey.length > blockSize) {
    normalizedKey = sha256(normalizedKey)
  }
  if (normalizedKey.length < blockSize) {
    const padded = new Uint8Array(blockSize)
    padded.set(normalizedKey)
    normalizedKey = padded
  }

  const innerPad = new Uint8Array(blockSize)
  const outerPad = new Uint8Array(blockSize)
  for (let index = 0; index < blockSize; index += 1) {
    const value = normalizedKey[index] ?? 0
    innerPad[index] = value ^ 0x36
    outerPad[index] = value ^ 0x5c
  }

  const inner = new Uint8Array(blockSize + message.length)
  inner.set(innerPad)
  inner.set(message, blockSize)
  const innerHash = sha256(inner)

  const outer = new Uint8Array(blockSize + innerHash.length)
  outer.set(outerPad)
  outer.set(innerHash, blockSize)
  return sha256(outer)
}

function sha256(bytes: Uint8Array): Uint8Array {
  const bitLength = bytes.length * 8
  const paddedLength = ((bytes.length + 9 + 63) & ~63) >>> 0
  const padded = new Uint8Array(paddedLength)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(paddedLength - 4, bitLength)

  let a0 = 0x6a09e667
  let b0 = 0xbb67ae85
  let c0 = 0x3c6ef372
  let d0 = 0xa54ff53a
  let e0 = 0x510e527f
  let f0 = 0x9b05688c
  let g0 = 0x1f83d9ab
  let h0 = 0x5be0cd19
  const w = new Uint32Array(64)

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      w[index] = view.getUint32(offset + index * 4)
    }
    for (let index = 16; index < 64; index += 1) {
      const value15 = w[index - 15] ?? 0
      const value2 = w[index - 2] ?? 0
      const s0 =
        rightRotate(value15, 7) ^ rightRotate(value15, 18) ^ (value15 >>> 3)
      const s1 =
        rightRotate(value2, 17) ^ rightRotate(value2, 19) ^ (value2 >>> 10)
      w[index] = ((w[index - 16] ?? 0) + s0 + (w[index - 7] ?? 0) + s1) >>> 0
    }

    let a = a0
    let b = b0
    let c = c0
    let d = d0
    let e = e0
    let f = f0
    let g = g0
    let h = h0

    for (let index = 0; index < 64; index += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 =
        (h + s1 + ch + (SHA256_K[index] ?? 0) + (w[index] ?? 0)) >>> 0
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (s0 + maj) >>> 0
      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    a0 = (a0 + a) >>> 0
    b0 = (b0 + b) >>> 0
    c0 = (c0 + c) >>> 0
    d0 = (d0 + d) >>> 0
    e0 = (e0 + e) >>> 0
    f0 = (f0 + f) >>> 0
    g0 = (g0 + g) >>> 0
    h0 = (h0 + h) >>> 0
  }

  const digest = new Uint8Array(32)
  const digestView = new DataView(digest.buffer)
  digestView.setUint32(0, a0)
  digestView.setUint32(4, b0)
  digestView.setUint32(8, c0)
  digestView.setUint32(12, d0)
  digestView.setUint32(16, e0)
  digestView.setUint32(20, f0)
  digestView.setUint32(24, g0)
  digestView.setUint32(28, h0)
  return digest
}

function rightRotate(value: number, amount: number): number {
  return ((value >>> amount) | (value << (32 - amount))) >>> 0
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = ""
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0")
  }
  return hex
}
