// POST /api/products : hanya Admin (Staff mendapat 403 dari server).
export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const input = await parseProductInput(event)

  const [created] = await useDb()
    .insert(tables.products)
    .values({ name: input.name, category: input.category, price: input.price, stock: input.stock })
    .returning({ id: tables.products.id })

  setResponseStatus(event, 201)
  return { id: created!.id }
})
