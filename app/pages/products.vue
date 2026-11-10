<script setup lang="ts">
interface Product { id: number, name: string, category: string, price: number, stock: number }

const toast = useToast()
const { user } = useUserSession()
const isAdmin = computed(() => (user.value as any)?.role === 'admin')

// ---- Cari + filter (pencarian ditunda 300 ms agar tidak memanggil API di tiap ketikan) ----
const search = ref('')
const debouncedSearch = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
watch(search, (v) => {
  clearTimeout(timer)
  timer = setTimeout(() => { debouncedSearch.value = v.trim() }, 300)
})
const category = ref('all') // 'all' = semua kategori (Select tidak boleh bernilai string kosong)

const { data, status, error, refresh } = await useFetch<{ items: Product[], categories: string[] }>('/api/products', {
  query: computed(() => ({
    q: debouncedSearch.value || undefined,
    category: category.value === 'all' ? undefined : category.value
  }))
})

const items = computed(() => data.value?.items ?? [])
const categories = computed(() => data.value?.categories ?? [])
const categoryOptions = computed(() => [
  { label: 'Semua kategori', value: 'all' },
  ...categories.value.map(c => ({ label: c, value: c }))
])
const loading = computed(() => status.value === 'pending')
const hasFilter = computed(() => !!debouncedSearch.value || category.value !== 'all')

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const formatRupiah = (n: number) => rupiah.format(n)

function resetFilter() {
  search.value = ''
  debouncedSearch.value = ''
  category.value = 'all'
}

// ---- Form tambah / ubah ----
const formOpen = ref(false)
const editing = ref<Product | null>(null)
const saving = ref(false)
const form = reactive({ name: '', category: '', price: '' as string | number, stock: '' as string | number })
const errors = reactive<Record<string, string>>({})

function clearErrors() {
  for (const k of Object.keys(errors)) delete errors[k]
}

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', category: '', price: '', stock: '' })
  clearErrors()
  formOpen.value = true
}

function openEdit(p: Product) {
  editing.value = p
  Object.assign(form, { name: p.name, category: p.category, price: String(p.price), stock: String(p.stock) })
  clearErrors()
  formOpen.value = true
}

// Validasi di klien hanya untuk umpan balik cepat. Yang menjadi penentu tetap validasi di server.
function validate(): boolean {
  clearErrors()
  const price = String(form.price ?? '').trim()
  const stock = String(form.stock ?? '').trim()
  if (!form.name.trim()) errors.name = 'Nama produk wajib diisi'
  if (!form.category.trim()) errors.category = 'Kategori wajib diisi'
  if (price === '' || !Number.isInteger(Number(price)) || Number(price) <= 0) {
    errors.price = 'Harga harus bilangan bulat lebih dari 0'
  }
  if (stock === '' || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
    errors.stock = 'Stok harus bilangan bulat 0 atau lebih'
  }
  return Object.keys(errors).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const isEdit = !!editing.value
    await $fetch(isEdit ? `/api/products/${editing.value!.id}` : '/api/products', {
      method: isEdit ? 'PUT' : 'POST',
      body: {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        stock: Number(form.stock)
      }
    })
    toast.add({ title: isEdit ? 'Produk diperbarui' : 'Produk ditambahkan', color: 'success' })
    formOpen.value = false
    await refresh()
  } catch (err: any) {
    const fieldErrors = err?.data?.data?.fieldErrors
    if (fieldErrors) Object.assign(errors, fieldErrors)
    toast.add({
      title: 'Gagal menyimpan produk',
      description: fieldErrors ? 'Periksa isian yang bertanda merah.' : (err?.data?.statusMessage || 'Terjadi kesalahan.'),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

// ---- Hapus (dengan konfirmasi) ----
const deleteOpen = ref(false)
const deleteTarget = ref<Product | null>(null)
const deleting = ref(false)

function askDelete(p: Product) {
  deleteTarget.value = p
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/products/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Produk dihapus', color: 'success' })
    deleteOpen.value = false
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal menghapus produk', description: err?.data?.statusMessage || 'Terjadi kesalahan.', color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold">Produk</h1>
      <UButton v-if="isAdmin" icon="i-lucide-plus" @click="openCreate">Tambah produk</UButton>
    </div>

    <div class="mb-4 flex flex-col gap-2 sm:flex-row">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Cari nama produk..."
        class="w-full sm:max-w-xs"
      />
      <USelect v-model="category" :items="categoryOptions" class="w-full sm:w-56" />
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Gagal memuat produk"
      description="Coba muat ulang halaman."
      class="mb-4"
    />

    <div v-if="loading && !items.length" class="flex items-center justify-center gap-2 py-16 text-sm text-muted">
      <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
      Memuat produk...
    </div>

    <UCard v-else-if="!items.length && !error">
      <div class="py-8 text-center">
        <UIcon name="i-lucide-package-search" class="mx-auto mb-2 size-8 text-muted" />
        <p class="font-medium">{{ hasFilter ? 'Tidak ada produk yang cocok' : 'Belum ada produk' }}</p>
        <p class="mt-1 text-sm text-muted">
          {{ hasFilter ? 'Ubah kata kunci atau filter kategori.' : (isAdmin ? 'Klik "Tambah produk" untuk mulai.' : 'Produk akan tampil di sini.') }}
        </p>
        <UButton v-if="hasFilter" class="mt-4" color="neutral" variant="outline" @click="resetFilter">Reset filter</UButton>
      </div>
    </UCard>

    <template v-else-if="items.length">
      <!-- Desktop: tabel -->
      <div class="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block dark:border-gray-800 dark:bg-gray-900" :class="{ 'opacity-60': loading }">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 text-xs uppercase text-muted dark:border-gray-800 dark:bg-gray-950">
            <tr>
              <th class="px-4 py-3">Nama</th>
              <th class="px-4 py-3">Kategori</th>
              <th class="px-4 py-3 text-right">Harga</th>
              <th class="px-4 py-3 text-right">Stok</th>
              <th v-if="isAdmin" class="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="p in items" :key="p.id">
              <td class="px-4 py-3 font-medium">{{ p.name }}</td>
              <td class="px-4 py-3">{{ p.category }}</td>
              <td class="px-4 py-3 text-right">{{ formatRupiah(p.price) }}</td>
              <td class="px-4 py-3 text-right">
                <UBadge v-if="p.stock < 5" color="warning" variant="subtle">{{ p.stock }} (rendah)</UBadge>
                <span v-else>{{ p.stock }}</span>
              </td>
              <td v-if="isAdmin" class="px-4 py-3 text-right">
                <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" :aria-label="`Ubah ${p.name}`" @click="openEdit(p)" />
                <UButton icon="i-lucide-trash-2" color="error" variant="ghost" :aria-label="`Hapus ${p.name}`" @click="askDelete(p)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- HP: kartu -->
      <div class="space-y-3 md:hidden" :class="{ 'opacity-60': loading }">
        <UCard v-for="p in items" :key="p.id">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-medium">{{ p.name }}</p>
              <p class="text-sm text-muted">{{ p.category }}</p>
            </div>
            <p class="text-right text-sm font-medium">{{ formatRupiah(p.price) }}</p>
          </div>
          <div class="mt-3 flex items-center justify-between">
            <UBadge v-if="p.stock < 5" color="warning" variant="subtle">Stok {{ p.stock }} (rendah)</UBadge>
            <span v-else class="text-sm text-muted">Stok {{ p.stock }}</span>
            <div v-if="isAdmin">
              <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" :aria-label="`Ubah ${p.name}`" @click="openEdit(p)" />
              <UButton icon="i-lucide-trash-2" color="error" variant="ghost" :aria-label="`Hapus ${p.name}`" @click="askDelete(p)" />
            </div>
          </div>
        </UCard>
      </div>
    </template>

    <!-- Modal tambah / ubah -->
    <UModal v-model:open="formOpen" :title="editing ? 'Ubah produk' : 'Tambah produk'">
      <template #body>
        <form class="space-y-4" novalidate @submit.prevent="save">
          <UFormField label="Nama produk" name="name" required :error="errors.name">
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField label="Kategori" name="category" required :error="errors.category">
            <UInput v-model="form.category" list="category-list" class="w-full" />
            <datalist id="category-list">
              <option v-for="c in categories" :key="c" :value="c" />
            </datalist>
          </UFormField>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField label="Harga (Rp)" name="price" required :error="errors.price">
              <UInput v-model="form.price" type="number" min="1" step="1" class="w-full" />
            </UFormField>
            <UFormField label="Stok" name="stock" required :error="errors.stock">
              <UInput v-model="form.stock" type="number" min="0" step="1" class="w-full" />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="outline" :disabled="saving" @click="formOpen = false">Batal</UButton>
            <UButton type="submit" :loading="saving">Simpan</UButton>
          </div>
        </form>
      </template>
    </UModal>

    <!-- Modal konfirmasi hapus -->
    <UModal v-model:open="deleteOpen" title="Hapus produk?">
      <template #body>
        <p class="text-sm">
          Produk <strong>{{ deleteTarget?.name }}</strong> akan dihapus dari daftar produk.
          Riwayat pesanan yang memuat produk ini tetap utuh.
        </p>
        <div class="mt-4 flex justify-end gap-2">
          <UButton color="neutral" variant="outline" :disabled="deleting" @click="deleteOpen = false">Batal</UButton>
          <UButton color="error" :loading="deleting" @click="confirmDelete">Ya, hapus</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
