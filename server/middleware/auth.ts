// Lapisan pengaman bawaan: semua endpoint /api/* wajib login,
// kecuali /api/auth/* (login dan logout) dan /api/_* (internal Nuxt).
// Pengecekan peran (admin atau staff) tetap dilakukan di tiap route lewat requireRole().
export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? ''
  if (!path.startsWith('/api/')) return
  if (path.startsWith('/api/auth/') || path.startsWith('/api/_')) return

  await requireUserSession(event)
})
