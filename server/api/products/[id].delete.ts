import { and, eq, isNull } from 'drizzle-orm'

// DELETE /api/products/:id : hanya Admin. SOFT DELETE: baris tetap ada (deletedAt diisi),
// sehingga riwayat pesanan tidak rusak. order_items juga menyimpan snapshot nama dan harga.
export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const id = parseProductId(event)

  const p = tables.products
  const deleted = await useDb()
    .update(p)
    .set({ deletedAt: new Date() })
    .where(and(eq(p.id, id), isNull(p.deletedAt)))
    .returning({ id: p.id })

  if (deleted.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan' })
  }
  return { ok: true }
})
