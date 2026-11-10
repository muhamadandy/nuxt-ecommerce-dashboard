import { count, desc, eq, isNull, and, lt, sql } from 'drizzle-orm'

// GET /api/dashboard : ringkasan. Admin dan Staff boleh (cukup login, dijaga middleware).
export default defineEventHandler(async () => {
  const db = useDb()
  const p = tables.products
  const o = tables.orders

  const [productRows, orderRows, completedRows, lowStockRows, recentOrders] = await Promise.all([
    // Total produk: hanya yang belum di-soft delete
    db.select({ n: count() }).from(p).where(isNull(p.deletedAt)),
    db.select({ n: count() }).from(o),
    // Total nilai pesanan: HANYA status completed
    db.select({ total: sql<string | null>`coalesce(sum(${o.total}), 0)` }).from(o).where(eq(o.status, 'completed')),
    // Stok rendah: stok < 5 pada produk yang masih aktif
    db.select({ n: count() }).from(p).where(and(isNull(p.deletedAt), lt(p.stock, 5))),
    db
      .select({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt
      })
      .from(o)
      .orderBy(desc(o.createdAt), desc(o.id))
      .limit(5)
  ])

  return {
    totalProducts: Number(productRows[0]?.n ?? 0),
    totalOrders: Number(orderRows[0]?.n ?? 0),
    completedValue: Number(completedRows[0]?.total ?? 0),
    lowStockCount: Number(lowStockRows[0]?.n ?? 0),
    recentOrders
  }
})
