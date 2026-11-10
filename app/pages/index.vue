<script setup lang="ts">
const { user, clear } = useUserSession()

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear() // kosongkan status sesi di klien
  await navigateTo('/login')
}
</script>

<template>
  <main style="max-width: 640px; margin: 3rem auto; padding: 0 1rem; font-family: sans-serif">
    <h1>Dashboard</h1>
    <p>Halo, {{ user?.name }} ({{ user?.role }})</p>
    <button @click="logout">Keluar</button>
  </main>
</template>
