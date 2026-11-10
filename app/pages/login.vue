<script setup lang="ts">
const { fetch: refreshSession } = useUserSession()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  errorMessage.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await refreshSession() // muat ulang status sesi di sisi klien
    await navigateTo('/')
  } catch (e: any) {
    errorMessage.value = e?.data?.message ?? 'Terjadi kesalahan. Coba lagi.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main style="max-width: 360px; margin: 4rem auto; padding: 0 1rem; font-family: sans-serif">
    <h1>Masuk</h1>
    <form @submit.prevent="onSubmit" style="display: grid; gap: 0.75rem">
      <label>
        Email
        <input v-model="email" type="email" required autocomplete="username" style="width: 100%" />
      </label>
      <label>
        Kata sandi
        <input v-model="password" type="password" required autocomplete="current-password" style="width: 100%" />
      </label>
      <p v-if="errorMessage" role="alert" style="color: #b91c1c; margin: 0">{{ errorMessage }}</p>
      <button type="submit" :disabled="loading">{{ loading ? 'Memproses...' : 'Masuk' }}</button>
    </form>
  </main>
</template>
