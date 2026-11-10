import { z } from 'zod'

export const ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled'] as const
export type OrderStatus = typeof ORDER_STATUSES[number]

const statusSchema = z.enum(ORDER_STATUSES)

export function parseOrderId(event: any): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'ID pesanan tidak valid' })
  }
  return id
}

export function parseOrderStatus(value: unknown): OrderStatus {
  const result = statusSchema.safeParse(value)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Status tidak valid' })
  }
  return result.data
}
