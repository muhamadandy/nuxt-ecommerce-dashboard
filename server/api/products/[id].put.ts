import { and, eq, isNull } from 'drizzle-orm'

// PUT /api/products/:id : hanya Admin.
export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const id = parseProductId(event)
  const input = await parseProductInput(event)

  const p = tables.products
  const updated = await useDb()
    .update(p)
    .set({ name: input.name, category: input.category, price: input.price, stock: input.stock, updatedAt: new Date() })
    .where(and(eq(p.id, id), isNull(p.deletedAt)))
    .returning({ id: p.id })

  if (updated.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan' })
  }
  return { id }
})
