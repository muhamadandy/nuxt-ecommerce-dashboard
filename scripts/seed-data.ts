import type { PgDatabase } from 'drizzle-orm/pg-core'
import * as schema from '../server/database/schema'
import { createPasswordHash } from '../server/utils/password'

const { users, products, orders, orderItems } = schema

// Dua akun demo sesuai ketentuan tes
const DEMO_USERS = [
  { name: 'Admin Demo', email: 'admin@example.com', password: 'AdminDemo123!', role: 'admin' as const },
  { name: 'Staff Demo', email: 'staff@example.com', password: 'StaffDemo123!', role: 'staff' as const },
]

// 12 produk di 3 kategori. Dua produk bertanda "stok rendah" (stok < 5).
const DEMO_PRODUCTS = [
  { name: 'Headphone Nirkabel Aurora', category: 'Elektronik', price: 450000, stock: 25 },
  { name: 'Power Bank 10.000 mAh', category: 'Elektronik', price: 185000, stock: 40 },
  { name: 'Keyboard Mekanik Mini', category: 'Elektronik', price: 620000, stock: 3 }, // stok rendah
  { name: 'Speaker Bluetooth Portabel', category: 'Elektronik', price: 330000, stock: 18 },
  { name: 'Kemeja Linen Pria', category: 'Fashion', price: 225000, stock: 30 },
  { name: 'Jaket Denim Unisex', category: 'Fashion', price: 399000, stock: 12 },
  { name: 'Sepatu Sneakers Kanvas', category: 'Fashion', price: 289000, stock: 4 }, // stok rendah
  { name: 'Tas Ransel Harian', category: 'Fashion', price: 265000, stock: 22 },
  { name: 'Set Panci Anti Lengket', category: 'Peralatan Rumah', price: 349000, stock: 15 },
  { name: 'Lampu Meja LED', category: 'Peralatan Rumah', price: 135000, stock: 35 },
  { name: 'Rak Dapur Serbaguna', category: 'Peralatan Rumah', price: 210000, stock: 9 },
  { name: 'Dispenser Air Mini', category: 'Peralatan Rumah', price: 575000, stock: 8 },
]

// 10 pesanan: 3 completed, 3 processing, 2 pending, 2 cancelled.
// items: [indeks produk di DEMO_PRODUCTS, jumlah]
const DEMO_ORDERS = [
  { customer: 'Rina Kartika', status: 'completed' as const, daysAgo: 12, items: [[0, 1], [1, 2]] },
  { customer: 'Budi Santoso', status: 'completed' as const, daysAgo: 10, items: [[4, 2]] },
  { customer: 'Siti Maharani', status: 'completed' as const, daysAgo: 8, items: [[8, 1], [9, 1]] },
  { customer: 'Agus Prasetyo', status: 'processing' as const, daysAgo: 5, items: [[5, 1], [7, 1]] },
  { customer: 'Dewi Lestari', status: 'processing' as const, daysAgo: 4, items: [[3, 1]] },
  { customer: 'Hendra Wijaya', status: 'processing' as const, daysAgo: 3, items: [[11, 1], [10, 1]] },
  { customer: 'Maya Anggraini', status: 'pending' as const, daysAgo: 2, items: [[2, 1]] },
  { customer: 'Fajar Nugroho', status: 'pending' as const, daysAgo: 1, items: [[6, 2], [1, 1]] },
  { customer: 'Lina Marlina', status: 'cancelled' as const, daysAgo: 7, items: [[0, 1]] },
  { customer: 'Tomi Hidayat', status: 'cancelled' as const, daysAgo: 6, items: [[4, 1], [5, 1]] },
] as const

const DAY = 24 * 60 * 60 * 1000

export async function seed(db: PgDatabase<any, typeof schema>) {
  // Hapus data lama (urutan: anak dulu, baru induk) agar seed bisa dijalankan berulang.
  await db.delete(orderItems)
  await db.delete(orders)
  await db.delete(products)
  await db.delete(users)

  // 1. Pengguna (kata sandi di-hash)
  const userRows = await Promise.all(
    DEMO_USERS.map(async (u) => ({
      name: u.name,
      email: u.email,
      role: u.role,
      passwordHash: await createPasswordHash(u.password),
    })),
  )
  await db.insert(users).values(userRows)

  // 2. Produk
  const productRows = await db.insert(products).values(DEMO_PRODUCTS).returning()

  // 3. Pesanan
  const now = Date.now()
  const orderValues = DEMO_ORDERS.map((o, i) => {
    const total = o.items.reduce((sum, [pi, qty]) => sum + DEMO_PRODUCTS[pi]!.price * qty, 0)
    return {
      orderNumber: `ORD-2026-${String(i + 1).padStart(4, '0')}`,
      customerName: o.customer,
      status: o.status,
      total,
      createdAt: new Date(now - o.daysAgo * DAY),
    }
  })
  const orderRows = await db.insert(orders).values(orderValues).returning()

  // 4. Item pesanan (nama dan harga disalin dari produk saat pesanan dibuat)
  const itemValues = DEMO_ORDERS.flatMap((o, i) =>
    o.items.map(([pi, qty]) => {
      const product = productRows[pi]!
      return {
        orderId: orderRows[i]!.id,
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: qty,
      }
    }),
  )
  await db.insert(orderItems).values(itemValues)

  return {
    users: userRows.length,
    products: productRows.length,
    orders: orderRows.length,
    items: itemValues.length,
  }
}
