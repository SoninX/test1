import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin(async (nuxtApp) => {
  // We must wait for Nuxt to be ready and hydrated
  nuxtApp.hook('app:mounted', () => {
    if (import.meta.client) {
      const authStore = useAuthStore();
      // Call the init action inside the store
      authStore.initSessionWatcher();
    }
  });
});