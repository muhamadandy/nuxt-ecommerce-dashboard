<script setup lang="ts">
type Status = 'pending' | 'processing' | 'completed' | 'cancelled'
interface Order { id: number, orderNumber: string, customerName: string, status: Status, total: number, createdAt: string }
interface Summary {
  totalProducts: number
  totalOrders: number
  completedValue: number
  lowStockCount: number
  recentOrders: Order[]
}

const { user } = useUserSession()
const { data, status, error, refresh } = await useFetch<Summary>('/api/dashboard')
const loading = computed(() => status.value === 'pending' && !data.value)

const statusMeta: Record<Status, { label: string, color: 'warning' | 'info' | 'success' | 'error' }> = {
  pending: { label: 'Pending', color: 'warning' },
  processing: { label: 'Processing', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' }
}

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const formatRupiah = (n: number) => rupiah.format(n)
const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })
const formatDate = (s: string) => dateFmt.format(new Date(s))

const stats = computed(() => {
  const d = data.value
  return [
    { label: 'Total produk', value: String(d?.totalProducts ?? 0), icon: 'i-lucide-package', to: '/products' },
    { label: 'Total pesanan', value: String(d?.totalOrders ?? 0), icon: 'i-lucide-shopping-cart', to: '/orders' },
    { label: 'Nilai pesanan selesai', value: formatRupiah(d?.completedValue ?? 0), icon: 'i-lucide-banknote', to: '/orders' },
    { label: 'Produk stok < 5', value: String(d?.lowStockCount ?? 0), icon: 'i-lucide-triangle-alert', to: '/products', warn: (d?.lowStockCount ?? 0) > 0 }
  ]
})
</script>

<template>
  <div>
    <div class="mb-4">
      <h1 class="text-2xl font-semibold">Dashboard</h1>
      <p class="text-sm text-muted">Halo, {{ (user as any)?.name || (user as any)?.email }}.</p>
    </div>

    <UAlert v-if="error" color="error" variant="subtle" title="Gagal memuat dashboard" class="mb-4">
      <template #description>
        <UButton size="xs" color="error" variant="outline" class="mt-2" @click="refresh()">Coba lagi</UButton>
      </template>
    </UAlert>

    <div v-if="loading" class="flex items-center justify-center gap-2 py-16 text-sm text-muted">
      <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
      Memuat dashboard...
    </div>

    <template v-else-if="data">
      <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink v-for="s in stats" :key="s.label" :to="s.to">
          <UCard class="h-full transition hover:shadow-md">
            <div class="flex items-center justify-between">
              <p class="text-sm text-muted">{{ s.label }}</p>
              <UIcon :name="s.icon" class="size-5" :class="s.warn ? 'text-warning' : 'text-muted'" />
            </div>
            <p class="mt-2 text-2xl font-semibold" :class="{ 'text-warning': s.warn }">{{ s.value }}</p>
          </UCard>
        </NuxtLink>
      </div>

      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold">5 pesanan terbaru</h2>
        <UButton to="/orders" color="neutral" variant="ghost" trailing-icon="i-lucide-arrow-right">Lihat semua</UButton>
      </div>

      <UCard v-if="!data.recentOrders.length">
        <p class="py-6 text-center text-sm text-muted">Belum ada pesanan.</p>
      </UCard>

      <template v-else>
        <!-- Desktop: tabel -->
        <div class="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block dark:border-gray-800 dark:bg-gray-900">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-xs uppercase text-muted dark:border-gray-800 dark:bg-gray-950">
              <tr>
                <th class="px-4 py-3">Nomor</th>
                <th class="px-4 py-3">Pelanggan</th>
                <th class="px-4 py-3">Tanggal</th>
                <th class="px-4 py-3 text-right">Total</th>
                <th class="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="o in data.recentOrders" :key="o.id">
                <td class="px-4 py-3 font-medium">{{ o.orderNumber }}</td>
                <td class="px-4 py-3">{{ o.customerName }}</td>
                <td class="px-4 py-3">{{ formatDate(o.createdAt) }}</td>
                <td class="px-4 py-3 text-right">{{ formatRupiah(o.total) }}</td>
                <td class="px-4 py-3"><UBadge :color="statusMeta[o.status].color" variant="subtle">{{ statusMeta[o.status].label }}</UBadge></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- HP: kartu -->
        <div class="space-y-3 md:hidden">
          <UCard v-for="o in data.recentOrders" :key="o.id">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-medium">{{ o.orderNumber }}</p>
                <p class="text-sm text-muted">{{ o.customerName }}</p>
              </div>
              <UBadge :color="statusMeta[o.status].color" variant="subtle">{{ statusMeta[o.status].label }}</UBadge>
            </div>
            <div class="mt-3 flex items-center justify-between text-sm">
              <span class="text-muted">{{ formatDate(o.createdAt) }}</span>
              <span class="font-medium">{{ formatRupiah(o.total) }}</span>
            </div>
          </UCard>
        </div>
      </template>
    </template>
  </div>
</template>
