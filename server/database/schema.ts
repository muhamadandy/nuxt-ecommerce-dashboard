import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ---------- Enum ----------
export const roleEnum = pgEnum('role', ['admin', 'staff'])
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'completed',
  'cancelled',
])

// ---------- Users ----------
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('staff'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ---------- Products ----------
// Harga disimpan sebagai bilangan bulat Rupiah (tanpa desimal).
// deletedAt dipakai untuk soft delete: produk yang dihapus tidak tampil di daftar,
// tetapi baris aslinya tetap ada sehingga riwayat pesanan tidak rusak.
export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    price: integer('price').notNull(),
    stock: integer('stock').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    check('products_price_positive', sql`${t.price} > 0`),
    check('products_stock_non_negative', sql`${t.stock} >= 0`),
    index('products_category_idx').on(t.category),
  ],
)

// ---------- Orders ----------
export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    orderNumber: text('order_number').notNull().unique(),
    customerName: text('customer_name').notNull(),
    status: orderStatusEnum('status').notNull().default('pending'),
    total: integer('total').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('orders_status_idx').on(t.status)],
)

// ---------- Order items ----------
// productName dan unitPrice disalin saat pesanan dibuat (snapshot),
// jadi perubahan atau penghapusan produk tidak mengubah riwayat pesanan.
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, {
    onDelete: 'set null',
  }),
  productName: text('product_name').notNull(),
  unitPrice: integer('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
})

export type User = typeof users.$inferSelect
export type Product = typeof products.$inferSelect
export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
