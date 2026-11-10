import type { H3Event } from 'h3'

type Role = 'admin' | 'staff'

// Pastikan pengguna sudah login DAN punya salah satu peran yang diizinkan.
// Belum login  -> 401 (dari requireUserSession)
// Peran salah  -> 403
// Dipakai di setiap route server yang mengubah data, misalnya: await requireRole(event, ['admin'])
export async function requireRole(event: H3Event, roles: Role[]) {
  const { user } = await requireUserSession(event)
  if (!roles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
    })
  }
  return user
}
