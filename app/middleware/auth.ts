import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  // We need to initialize the store *inside* the middleware
  // to ensure it's fresh for every route change.
  const auth = useAuthStore();

  // If not authenticated and not already on the login page
  if (!auth.isAuthenticated && to.path !== '/auth/login') {
    // Redirect to login, preserving the intended destination
    return navigateTo('/auth/login', { replace: true });
  }

  // If authenticated and trying to access login page, redirect to home
  if (auth.isAuthenticated && to.path === '/auth/login') {
    return navigateTo('/', { replace: true });
  }
});