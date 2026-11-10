import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../server/database/schema'
import { seed } from './seed-data'

// Dijalankan lewat: npm run seed  (membaca .env)
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL belum diatur. Isi file .env terlebih dahulu.')
  process.exit(1)
}

const db = drizzle(neon(url), { schema })

seed(db)
  .then((r) => {
    console.log(`Seed selesai: ${r.users} pengguna, ${r.products} produk, ${r.orders} pesanan, ${r.items} item pesanan.`)
  })
  .catch((e) => {
    console.error('Seed gagal:', e)
    process.exit(1)
  })
