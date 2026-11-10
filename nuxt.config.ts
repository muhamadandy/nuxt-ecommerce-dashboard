// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // Daftar modul yang digunakan
  modules: ["nuxt-auth-utils", "@nuxt/ui"],

  // Konfigurasi file CSS global
  css: ["~/assets/css/main.css"],
});
