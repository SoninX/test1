// app/middleware/auth.ts (No changes needed, relies on updated store getter)
import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();

  // If not authenticated (checks cookie now) and not already on the login page
  if (!auth.isAuthenticated && to.path !== '/auth/login') {
    return navigateTo('/auth/login', { replace: true });
  }

  // If authenticated (checks cookie now) and trying to access login page, redirect to home
  if (auth.isAuthenticated && to.path === '/auth/login') {
    return navigateTo('/', { replace: true });
  }
});