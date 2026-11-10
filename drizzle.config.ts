import { defineConfig } from 'drizzle-kit'

// Muat .env untuk perintah drizzle-kit (Node 20.12+ mendukung ini)
try {
  process.loadEnvFile('.env')
} catch {}

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dbCredentials: {
    // drizzle-kit lebih aman memakai koneksi tanpa pooler
    url: (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)!,
  },
})
