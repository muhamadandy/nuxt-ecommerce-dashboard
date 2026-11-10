// Berjalan di setiap perpindahan halaman.
// Belum login -> paksa ke /login. Sudah login tetapi membuka /login -> kembali ke beranda.
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value && to.path !== '/login') {
    return navigateTo('/login')
  }
  if (loggedIn.value && to.path === '/login') {
    return navigateTo('/')
  }
})
