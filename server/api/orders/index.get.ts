import { desc, eq } from 'drizzle-orm'

// GET /api/orders?status=... : Admin dan Staff boleh melihat.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const o = tables.orders

  const base = useDb()
    .select({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt
    })
    .from(o)

  // Filter status opsional; nilai di luar empat status yang valid ditolak (400)
  const items = query.status
    ? await base.where(eq(o.status, parseOrderStatus(query.status))).orderBy(desc(o.createdAt), desc(o.id))
    : await base.orderBy(desc(o.createdAt), desc(o.id))

  return { items }
})
