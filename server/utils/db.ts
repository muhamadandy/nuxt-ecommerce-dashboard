import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../database/schema'

// Semua tabel bisa dipakai di route server lewat `tables.products`, dst.
// (file di server/utils otomatis di-import oleh Nuxt)
export const tables = schema

function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw createError({
      statusCode: 500,
      statusMessage: 'DATABASE_URL belum diatur di environment',
    })
  }
  return drizzle(neon(url), { schema })
}

let db: ReturnType<typeof createDb> | undefined

// Koneksi dibuat sekali, lalu dipakai ulang.
export function useDb() {
  return (db ??= createDb())
}
