<script setup lang="ts">
// Halaman login. Layout default sengaja tidak menampilkan header di /login.
const { loggedIn, fetch: refreshSession } = useUserSession()

// Pengaman tambahan: kalau sudah login, tidak perlu melihat halaman ini.
if (loggedIn.value) {
  await navigateTo('/')
}

const form = reactive({ email: '', password: '' })
const errors = reactive<{ email?: string, password?: string }>({})
const formError = ref('')
const submitting = ref(false)

function validate(): boolean {
  errors.email = undefined
  errors.password = undefined
  if (!form.email.trim()) errors.email = 'Email wajib diisi'
  else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Format email tidak valid'
  if (!form.password) errors.password = 'Kata sandi wajib diisi'
  return !errors.email && !errors.password
}

async function submit() {
  formError.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: form.email.trim(), password: form.password }
    })
    await refreshSession()
    await navigateTo('/')
  } catch (err: any) {
    formError.value = err?.data?.statusMessage || err?.data?.message || 'Email atau kata sandi salah.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 dark:bg-gray-950">
    <UCard class="w-full max-w-sm">
      <div class="mb-6 text-center">
        <UIcon name="i-lucide-store" class="mx-auto mb-2 size-8 text-primary" />
        <h1 class="text-xl font-semibold">Masuk</h1>
        <p class="mt-1 text-sm text-muted">Toko Dashboard</p>
      </div>

      <form class="space-y-4" novalidate @submit.prevent="submit">
        <UAlert
          v-if="formError"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :description="formError"
        />

        <UFormField label="Email" name="email" :error="errors.email">
          <UInput
            v-model="form.email"
            type="email"
            autocomplete="username"
            placeholder="nama@example.com"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Kata sandi" name="password" :error="errors.password">
          <UInput
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            class="w-full"
          />
        </UFormField>

        <UButton type="submit" block :loading="submitting">Masuk</UButton>
      </form>
    </UCard>
  </div>
</template>
