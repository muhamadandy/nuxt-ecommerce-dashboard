import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

// Hash kata sandi dengan scrypt (bawaan Node, tanpa paket tambahan).
// Format yang disimpan di database: scrypt$N$r$p$salt(base64)$hash(base64)
// Tiap kata sandi punya salt acak sendiri, jadi dua kata sandi yang sama
// menghasilkan hash yang berbeda.

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>

const N = 16384
const R = 8
const P = 1
const KEY_LENGTH = 64
const MAXMEM = 64 * 1024 * 1024

export async function createPasswordHash(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: MAXMEM })
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyPasswordHash(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const [, n, r, p, saltB64, hashB64] = parts
  const salt = Buffer.from(saltB64!, 'base64')
  const expected = Buffer.from(hashB64!, 'base64')

  const actual = await scryptAsync(password, salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MAXMEM,
  })

  // timingSafeEqual: perbandingan waktu-konstan agar tidak bocor lewat selisih waktu
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
