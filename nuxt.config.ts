// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },

  ssr: false,

  plugins: ["~/plugins/api"],

  modules: ["@nuxt/ui", "@nuxt/eslint", "@pinia/nuxt", "@pinia/colada-nuxt"],

  css: ["~/assets/css/main.css"],

  compatibilityDate: "2025-07-16",

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_BASE_URL,
    },
  },
  colorMode: {
    preference: 'light', // Force light mode
    fallback: 'light',   // Fallback to light if preference fails
  },
  ui: {
    // theme: {
    //   colors: [
    //     'primary',
    //     'secondary',
    //     'info',
    //     'success',
    //     'warning',
    //     'error'
    //   ]
    // },
  },
 
});
