import { eq } from 'drizzle-orm'

// PATCH /api/orders/:id/status  body: { status } : hanya Admin (Staff mendapat 403).
export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const id = parseOrderId(event)
  const body = ((await readBody(event)) ?? {}) as Record<string, unknown>
  const status = parseOrderStatus(body.status)

  const o = tables.orders
  const updated = await useDb()
    .update(o)
    .set({ status })
    .where(eq(o.id, id))
    .returning({ id: o.id, status: o.status })

  if (updated.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan' })
  }
  return updated[0]
})
