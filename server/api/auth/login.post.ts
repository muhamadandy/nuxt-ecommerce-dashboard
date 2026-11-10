import { z } from 'zod'
import { eq } from 'drizzle-orm'

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: parsed.error.issues[0]?.message ?? 'Data tidak valid',
    })
  }
  const { email, password } = parsed.data

  const db = useDb()
  const [user] = await db.select().from(tables.users).where(eq(tables.users.email, email)).limit(1)

  // Pesan sengaja sama untuk "email tidak ada" dan "kata sandi salah",
  // supaya orang luar tidak bisa menebak email mana yang terdaftar.
  const valid = user ? await verifyPasswordHash(password, user.passwordHash) : false
  if (!user || !valid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Email atau kata sandi salah.',
    })
  }

  const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role }
  await setUserSession(event, { user: sessionUser })
  return sessionUser
})
