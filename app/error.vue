<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error.statusCode === 404)
const goHome = () => clearError({ redirect: '/' })
</script>

<template>
  <UApp>
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <UCard class="w-full max-w-md text-center">
        <UIcon :name="is404 ? 'i-lucide-file-question' : 'i-lucide-triangle-alert'" class="mx-auto mb-3 size-10 text-muted" />
        <p class="text-sm text-muted">{{ error.statusCode }}</p>
        <h1 class="mt-1 text-xl font-semibold">{{ is404 ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan' }}</h1>
        <p class="mt-2 text-sm text-muted">
          {{ is404 ? 'Alamat yang Anda buka tidak ada.' : 'Silakan coba lagi. Jika masih terjadi, hubungi admin.' }}
        </p>
        <UButton class="mt-5" @click="goHome">Kembali ke beranda</UButton>
      </UCard>
    </div>
  </UApp>
</template>
