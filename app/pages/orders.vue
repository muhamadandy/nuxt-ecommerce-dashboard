<script setup lang="ts">
type Status = 'pending' | 'processing' | 'completed' | 'cancelled'
interface Order { id: number, orderNumber: string, customerName: string, status: Status, total: number, createdAt: string }
interface OrderDetail extends Order {
  items: { id: number, productName: string, unitPrice: number, quantity: number, lineTotal: number }[]
}

const toast = useToast()
const { user } = useUserSession()
const isAdmin = computed(() => (user.value as any)?.role === 'admin')

const statusMeta: Record<Status, { label: string, color: 'warning' | 'info' | 'success' | 'error' }> = {
  pending: { label: 'Pending', color: 'warning' },
  processing: { label: 'Processing', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' }
}
const statusOptions = (Object.keys(statusMeta) as Status[]).map(s => ({ label: statusMeta[s].label, value: s }))
const filterOptions = [{ label: 'Semua status', value: 'all' }, ...statusOptions]

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const formatRupiah = (n: number) => rupiah.format(n)
// Zona waktu dikunci ke WIB agar tampilan di server (SSR) dan browser sama
const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })
const formatDate = (s: string) => dateFmt.format(new Date(s))

// ---- Daftar + filter status ----
const statusFilter = ref('all')
const { data, status: fetchStatus, error, refresh } = await useFetch<{ items: Order[] }>('/api/orders', {
  query: computed(() => ({ status: statusFilter.value === 'all' ? undefined : statusFilter.value }))
})
const items = computed(() => data.value?.items ?? [])
const loading = computed(() => fetchStatus.value === 'pending')

// ---- Detail pesanan (modal) ----
const detailOpen = ref(false)
const detail = ref<OrderDetail | null>(null)
const detailLoading = ref(false)
const newStatus = ref<Status>('pending')
const savingStatus = ref(false)

async function openDetail(o: Order) {
  detail.value = null
  detailOpen.value = true
  detailLoading.value = true
  try {
    detail.value = await $fetch<OrderDetail>(`/api/orders/${o.id}`)
    newStatus.value = detail.value.status
  } catch (err: any) {
    detailOpen.value = false
    toast.add({ title: 'Gagal memuat detail pesanan', description: err?.data?.statusMessage || 'Terjadi kesalahan.', color: 'error' })
  } finally {
    detailLoading.value = false
  }
}

async function saveStatus() {
  if (!detail.value || newStatus.value === detail.value.status) return
  savingStatus.value = true
  try {
    await $fetch(`/api/orders/${detail.value.id}/status`, { method: 'PATCH', body: { status: newStatus.value } })
    detail.value.status = newStatus.value
    toast.add({ title: 'Status pesanan diperbarui', color: 'success' })
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal mengubah status', description: err?.data?.statusMessage || 'Terjadi kesalahan.', color: 'error' })
  } finally {
    savingStatus.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="mb-4 text-2xl font-semibold">Pesanan</h1>

    <div class="mb-4">
      <USelect v-model="statusFilter" :items="filterOptions" class="w-full sm:w-56" />
    </div>

    <UAlert v-if="error" color="error" variant="subtle" title="Gagal memuat pesanan" description="Coba muat ulang halaman." class="mb-4" />

    <div v-if="loading && !items.length" class="flex items-center justify-center gap-2 py-16 text-sm text-muted">
      <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
      Memuat pesanan...
    </div>

    <UCard v-else-if="!items.length && !error">
      <div class="py-8 text-center">
        <UIcon name="i-lucide-shopping-cart" class="mx-auto mb-2 size-8 text-muted" />
        <p class="font-medium">{{ statusFilter === 'all' ? 'Belum ada pesanan' : 'Tidak ada pesanan dengan status ini' }}</p>
        <UButton v-if="statusFilter !== 'all'" class="mt-4" color="neutral" variant="outline" @click="statusFilter = 'all'">Tampilkan semua</UButton>
      </div>
    </UCard>

    <template v-else-if="items.length">
      <!-- Desktop: tabel -->
      <div class="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block dark:border-gray-800 dark:bg-gray-900" :class="{ 'opacity-60': loading }">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 text-xs uppercase text-muted dark:border-gray-800 dark:bg-gray-950">
            <tr>
              <th class="px-4 py-3">Nomor</th>
              <th class="px-4 py-3">Pelanggan</th>
              <th class="px-4 py-3">Tanggal</th>
              <th class="px-4 py-3 text-right">Total</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right">Detail</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="o in items" :key="o.id">
              <td class="px-4 py-3 font-medium">{{ o.orderNumber }}</td>
              <td class="px-4 py-3">{{ o.customerName }}</td>
              <td class="px-4 py-3">{{ formatDate(o.createdAt) }}</td>
              <td class="px-4 py-3 text-right">{{ formatRupiah(o.total) }}</td>
              <td class="px-4 py-3"><UBadge :color="statusMeta[o.status].color" variant="subtle">{{ statusMeta[o.status].label }}</UBadge></td>
              <td class="px-4 py-3 text-right">
                <UButton icon="i-lucide-eye" color="neutral" variant="ghost" :aria-label="`Lihat ${o.orderNumber}`" @click="openDetail(o)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- HP: kartu -->
      <div class="space-y-3 md:hidden" :class="{ 'opacity-60': loading }">
        <UCard v-for="o in items" :key="o.id" class="cursor-pointer" @click="openDetail(o)">
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

    <!-- Modal detail pesanan -->
    <UModal v-model:open="detailOpen" :title="detail ? `Pesanan ${detail.orderNumber}` : 'Detail pesanan'">
      <template #body>
        <div v-if="detailLoading || !detail" class="flex items-center justify-center gap-2 py-10 text-sm text-muted">
          <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
          Memuat detail...
        </div>

        <div v-else class="space-y-4">
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-muted">Pelanggan</dt>
              <dd class="font-medium">{{ detail.customerName }}</dd>
            </div>
            <div>
              <dt class="text-muted">Tanggal</dt>
              <dd class="font-medium">{{ formatDate(detail.createdAt) }}</dd>
            </div>
            <div>
              <dt class="text-muted">Status</dt>
              <dd><UBadge :color="statusMeta[detail.status].color" variant="subtle">{{ statusMeta[detail.status].label }}</UBadge></dd>
            </div>
            <div>
              <dt class="text-muted">Total</dt>
              <dd class="font-medium">{{ formatRupiah(detail.total) }}</dd>
            </div>
          </dl>

          <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-gray-200 bg-gray-50 text-xs uppercase text-muted dark:border-gray-800 dark:bg-gray-950">
                <tr>
                  <th class="px-3 py-2">Produk</th>
                  <th class="px-3 py-2 text-right">Jml</th>
                  <th class="px-3 py-2 text-right">Harga satuan</th>
                  <th class="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="it in detail.items" :key="it.id">
                  <td class="px-3 py-2">{{ it.productName }}</td>
                  <td class="px-3 py-2 text-right">{{ it.quantity }}</td>
                  <td class="px-3 py-2 text-right">{{ formatRupiah(it.unitPrice) }}</td>
                  <td class="px-3 py-2 text-right">{{ formatRupiah(it.lineTotal) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Ubah status: hanya Admin (server juga menolak Staff dengan 403) -->
          <div v-if="isAdmin" class="flex flex-col gap-2 sm:flex-row sm:items-end">
            <UFormField label="Ubah status" class="flex-1">
              <USelect v-model="newStatus" :items="statusOptions" class="w-full" />
            </UFormField>
            <UButton :loading="savingStatus" :disabled="newStatus === detail.status" @click="saveStatus">Simpan status</UButton>
          </div>
          <p v-else class="text-sm text-muted">Hanya Admin yang dapat mengubah status pesanan.</p>
        </div>
      </template>
    </UModal>
  </div>
</template>
