/**
 * Deterministic pseudo-random utilities. Every series in the terminal is
 * generated from a fixed seed so data is stable across reloads and panels.
 */

/** mulberry32 — fast, high-quality 32-bit seeded PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Hash a string to a 32-bit seed (FNV-1a). */
export function hashSeed(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export class Rng {
  private next: () => number
  private spare: number | null = null

  constructor(seed: string | number) {
    this.next = mulberry32(typeof seed === 'string' ? hashSeed(seed) : seed)
  }

  /** Uniform in [0, 1). */
  uniform(): number {
    return this.next()
  }

  /** Uniform in [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.next()
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }

  /** Standard normal via Box–Muller (with spare caching). */
  normal(mean = 0, std = 1): number {
    if (this.spare !== null) {
      const s = this.spare
      this.spare = null
      return mean + std * s
    }
    let u = 0
    let v = 0
    while (u === 0) u = this.next()
    while (v === 0) v = this.next()
    const mag = Math.sqrt(-2 * Math.log(u))
    this.spare = mag * Math.sin(2 * Math.PI * v)
    return mean + std * mag * Math.cos(2 * Math.PI * v)
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }

  /** Bernoulli trial. */
  chance(p: number): boolean {
    return this.next() < p
  }
}
