// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },

  ssr: false,

  plugins: ["~/plugins/api", "~/plugins/msal.client"],

  modules: ["@nuxt/ui", "@nuxt/eslint", "@pinia/nuxt", "@pinia/colada-nuxt"],

  css: ["~/assets/css/main.css"],

  compatibilityDate: "2025-07-16",

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_BASE_URL,
      azureClientId: process.env.NUXT_PUBLIC_AZURE_CLIENT_ID,
      azureTenantId: process.env.NUXT_PUBLIC_AZURE_TENANT_ID,
      azureRedirectUri: process.env.NUXT_PUBLIC_AZURE_REDIRECT_URI
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
  vite: {
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
      }
    }
  }
 
});
