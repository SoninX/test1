// app/plugins/api.ts (Updated for Project 1 using cookie-based auth)

import type { FetchContext } from "ofetch"; // Keep original FetchContext type

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const toast = useToast();
  // Get router instance for programmatic navigation on errors
  const router = useRouter();

  // Common request interceptor - Reads token from Cookie
  const onRequest = ({ options }: FetchContext) => {
    // Use Nuxt's useCookie composable to get the token
    const accessToken = useCookie("access_token");

    if (accessToken.value) { // Check if the cookie has a value
      // Ensure options.headers exists and is a Headers object or assignable
      if (!options.headers) {
        options.headers = new Headers();
      }
      // Use Headers object methods for type safety
      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${accessToken.value}`);
      options.headers = headers; // Assign the modified Headers object back
    }
  };

  // Common response error handler - Adjusted for cookie clearing and routing
  const onResponseError = async ({ error, response }: FetchContext) => {
    // Handle cases where there is a response object (HTTP errors)
    if (response) {
       // Extract backend error message if available, otherwise use default
       // Use optional chaining (?.) and nullish coalescing (??) for safety
       const backendErrorMessage = response._data?.message ?? response._data?.detail ?? error?.message ?? 'An unknown error occurred';

      switch (response.status) {
        case 401: {
          console.error("Unauthorized request or token expired:", backendErrorMessage);
          // Clear authentication cookies
          const accessToken = useCookie("access_token");
          const refreshToken = useCookie("refresh_token");
          accessToken.value = null;
          refreshToken.value = null;


          toast.add({
            title: "Session Expired",
            description: "Please log in again.",
            color: "error",
            icon: "i-lucide-alert-circle",
          });

          await router.push("/auth/login");
          return;
        }
        case 403:
          console.error("Forbidden:", backendErrorMessage);
          toast.add({
            title: "Access Denied",
            description: backendErrorMessage,
            color: "error",
            icon: "i-lucide-ban",
          });
          break;

        case 404:
          console.error("Not Found:", backendErrorMessage);
          toast.add({
            title: "Not Found",
            description: backendErrorMessage,
            color: "error",
             icon: "i-lucide-search-x",
          });
          break;

        case 422:
          console.error("Validation Error:", backendErrorMessage);
          toast.add({
            title: "Validation Error",
            // You might want more specific parsing if backend returns detailed validation errors
            description: backendErrorMessage,
            color: "error",
            icon: "i-lucide-list-x"
          });
          break;

        case 500:
          console.error("Server Error:", backendErrorMessage);
          toast.add({
            title: "Server Error",
            description: "An internal server error occurred. Please try again later.",
            color: "error",
            icon: "i-lucide-server-crash",
          });
          break;

        default:
          console.error(`HTTP Error ${response.status}:`, backendErrorMessage);
          toast.add({
            title: `Error ${response.status}`,
            description: backendErrorMessage,
            color: "error",
            icon: "i-lucide-alert-triangle",
          });
      }
    } else if (error) {
      // Handle network errors or errors without a response object
      console.error("Network or Fetch Error:", error.message);
      toast.add({
        title: "Network Error",
        description: "Could not connect to the server. Please check your connection.",
        color: "error",
        icon: "i-lucide-wifi-off",
      });
    } else {
        // Fallback for unexpected scenarios
        console.error("An unexpected error occurred without response or error object");
         toast.add({
            title: "Unexpected Error",
            description: "An unexpected error occurred.",
            color: "error",
            icon: "i-lucide-alert-octagon",
          });
    }

    // Optionally re-throw the error if you want calling code (like useMutation) to catch it
    // throw error ?? new Error('API request failed');
  };

  // API v1 instance (assuming this uses the base API URL)
  const apiv1 = $fetch.create({
    baseURL: `${config.public.apiBaseUrl as string}/api/v1`, // Ensure this URL is correct
    onRequest,
    onResponseError, // Apply the updated error handler
  });

  // Example: If you needed a separate instance for Auth (like in Project 2)
  // const authApi = $fetch.create({
  //   baseURL: config.public.authApiUrl as string, // Make sure you have this in runtimeConfig
  //   onRequest,
  //   onResponseError,
  // });


  return {
    provide: {
      apiv1,
      // authApi, // Provide the auth instance if you create it
    },
  };
});