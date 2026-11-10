<script setup lang="ts">
// Layout utama: header + navigasi + area konten.
// Halaman /login tidak memakai kerangka ini (hanya slot polos), jadi login.vue tidak perlu diubah.
const route = useRoute()
const toast = useToast()
const { user, fetch: refreshSession } = useUserSession()

const isLoginPage = computed(() => route.path === '/login')
const isAdmin = computed(() => (user.value as any)?.role === 'admin')

// Menu sama untuk Admin dan Staff. Perbedaan peran ada pada AKSI di dalam halaman
// (tombol tambah/ubah/hapus, ubah status), dan itu dijaga di server (403), bukan hanya disembunyikan.
const navItems = computed(() => [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/', active: route.path === '/' },
  { label: 'Produk', icon: 'i-lucide-package', to: '/products', active: route.path.startsWith('/products') },
  { label: 'Pesanan', icon: 'i-lucide-shopping-cart', to: '/orders', active: route.path.startsWith('/orders') }
])

// Judul tab browser mengikuti halaman aktif
useHead({
  title: computed(() => {
    if (isLoginPage.value) return 'Masuk · Toko Dashboard'
    const active = navItems.value.find(i => i.active)
    return active ? `${active.label} · Toko Dashboard` : 'Toko Dashboard'
  })
})

const loggingOut = ref(false)
async function logout() {
  loggingOut.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await refreshSession()
    toast.add({ title: 'Berhasil keluar', color: 'success' })
    await navigateTo('/login')
  } catch {
    toast.add({ title: 'Gagal keluar', description: 'Coba lagi.', color: 'error' })
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div v-if="isLoginPage">
    <slot />
  </div>

  <div v-else class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
      <!-- HP: baris 1 = merek + pengguna + keluar, baris 2 = menu. Desktop: satu baris. -->
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 sm:px-6">
        <NuxtLink to="/" class="flex items-center gap-2 font-semibold">
          <UIcon name="i-lucide-store" class="size-5 text-primary" />
          <span>Toko Dashboard</span>
        </NuxtLink>

        <div class="ml-auto flex items-center gap-2 sm:order-last">
          <p class="hidden max-w-40 truncate text-sm font-medium md:block">
            {{ (user as any)?.name || (user as any)?.email }}
          </p>
          <UBadge :color="isAdmin ? 'primary' : 'neutral'" variant="subtle" class="capitalize">
            {{ (user as any)?.role }}
          </UBadge>
          <UButton
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            aria-label="Keluar"
            :loading="loggingOut"
            @click="logout"
          >
            <span class="hidden sm:inline">Keluar</span>
          </UButton>
        </div>

        <nav class="order-last w-full overflow-x-auto sm:order-none sm:ml-2 sm:w-auto sm:flex-1" aria-label="Navigasi utama">
          <UNavigationMenu :items="navItems" />
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-3 py-6 sm:px-6">
      <slot />
    </main>
  </div>
</template>
