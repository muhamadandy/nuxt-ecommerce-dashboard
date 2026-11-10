import { asc, eq } from 'drizzle-orm'

// GET /api/orders/:id : detail pesanan + item. Admin dan Staff boleh.
// Nama dan harga produk diambil dari snapshot di order_items, jadi tetap benar
// walaupun produknya sudah diubah atau di-soft delete.
export default defineEventHandler(async (event) => {
  const id = parseOrderId(event)
  const db = useDb()
  const o = tables.orders
  const i = tables.orderItems

  const [order] = await db.select().from(o).where(eq(o.id, id)).limit(1)
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan' })
  }

  const rows = await db
    .select({ id: i.id, productName: i.productName, unitPrice: i.unitPrice, quantity: i.quantity })
    .from(i)
    .where(eq(i.orderId, id))
    .orderBy(asc(i.id))

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    items: rows.map(r => ({ ...r, lineTotal: r.unitPrice * r.quantity }))
  }
})
