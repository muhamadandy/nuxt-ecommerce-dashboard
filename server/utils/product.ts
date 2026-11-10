import { z } from 'zod'

// Skema validasi produk (dipakai oleh POST dan PUT).
// Nilai dinormalisasi dulu supaya pesan error selalu berbahasa Indonesia
// (tipe salah / kosong tidak jatuh ke pesan bawaan Zod).
const productSchema = z.object({
  name: z.string().trim().min(1, 'Nama produk wajib diisi').max(150, 'Nama produk maksimal 150 karakter'),
  category: z.string().trim().min(1, 'Kategori wajib diisi').max(60, 'Kategori maksimal 60 karakter'),
  price: z.number().int('Harga harus bilangan bulat').positive('Harga harus lebih dari 0'),
  stock: z.number().int('Stok harus bilangan bulat').min(0, 'Stok harus bilangan bulat 0 atau lebih')
})

function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === '') return Number.NaN
  return Number(v)
}

export type ProductInput = z.infer<typeof productSchema>

export async function parseProductInput(event: any): Promise<ProductInput> {
  const body = ((await readBody(event)) ?? {}) as Record<string, unknown>

  const price = toNumber(body.price)
  const stock = toNumber(body.stock)

  const result = productSchema.safeParse({
    name: typeof body.name === 'string' ? body.name : '',
    category: typeof body.category === 'string' ? body.category : '',
    price: Number.isFinite(price) ? price : 0, // kosong/bukan angka -> ditolak "harus lebih dari 0"
    stock: Number.isFinite(stock) ? stock : -1 // kosong/bukan angka -> ditolak "0 atau lebih"
  })

  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    throw createError({ statusCode: 400, statusMessage: 'Validasi gagal', data: { fieldErrors } })
  }
  return result.data
}

export function parseProductId(event: any): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'ID produk tidak valid' })
  }
  return id
}
