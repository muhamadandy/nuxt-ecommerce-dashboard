import { and, asc, ilike, isNull, eq } from 'drizzle-orm'

// GET /api/products?q=...&category=...
// Boleh Admin dan Staff (sudah login dijaga middleware). Produk yang di-soft delete tidak ditampilkan.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 100) : ''
  const category = typeof query.category === 'string' ? query.category.trim() : ''

  const db = useDb()
  const p = tables.products

  const conditions = [isNull(p.deletedAt)]
  if (q) {
    const escaped = q.replace(/[\\%_]/g, '\\$&') // % dan _ dianggap huruf biasa
    conditions.push(ilike(p.name, `%${escaped}%`))
  }
  if (category) conditions.push(eq(p.category, category))

  const items = await db
    .select({ id: p.id, name: p.name, category: p.category, price: p.price, stock: p.stock })
    .from(p)
    .where(and(...conditions))
    .orderBy(asc(p.name))

  // Daftar kategori untuk dropdown filter (tidak ikut terfilter)
  const cats = await db
    .selectDistinct({ category: p.category })
    .from(p)
    .where(isNull(p.deletedAt))
    .orderBy(asc(p.category))

  return { items, categories: cats.map(c => c.category) }
})
