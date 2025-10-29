import type { FetchContext } from "ofetch";

export default defineNuxtPlugin(() => {
  // Removed token from here
  const config = useRuntimeConfig();
  const toast = useToast();

  // Common request interceptor
  const onRequest = ({ options }: FetchContext) => {
    // Moved token logic inside the function
    const authData = localStorage.getItem("zebo-auth");
    
    if (authData) {
      try {
        // Parse the stored data to get the access token
        const parsedData = JSON.parse(authData);
        const token = parsedData.data.accessToken; // Get the actual token string
        
        if (token) {
          options.headers = options.headers || new Headers();
          options.headers.set("Authorization", `Bearer ${token}`);
        }
      } catch (e) {
        console.error("Failed to parse auth token from localStorage", e);
      }
    }
  };

  // Common response error handler
  const onResponseError = async ({ error, response }: FetchContext) => {
    // ... (Your existing error handling logic remains the same)
    if (response && error) {
      switch (response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem("zebo-auth");
          window.location.href = "/auth/login";
          break;

        case 403:
          // Forbidden
          console.log("Access forbidden", error.message);
          toast.add({
            title: "Error",
            description: `Access forbidden ${error.message}`,
            color: "error",
          });
          break;

        case 404:
          // Not found
          console.log("Resource not found", error.message);
          toast.add({
            title: "Error",
            icon: "i-lucide-circle-alert",
            description: `Resource not found ${error.message}`,
            color: "error",
          });
          break;

        case 422:
          // Validation errors
          console.log("Validation errors", error.message);
          toast.add({
            title: "Error",
            description: `Validation failed ${error.message}`,
            color: "error",
          });
          break;

        case 500:
          // Server error
          console.log("Server error occurred", error.message);
          toast.add({
            title: "Error",
            icon: "i-lucide-server-crash",
            description: `Server error occurred ${error.message}`,
            color: "error",
          });
          break;

        default:
          console.log("An error occurred", error.message);
          toast.add({
            title: "Error",
            description: `An error occurred ${error.message}`,
            color: "error",
          });
      }
    } else if (error && error.message) {
      // Network error
      console.log("Network error occurred", error.message);
      toast.add({
        title: "Error",
        icon: "i-lucide-wifi-off",
        description: `Network error occurred ${error.message}`,
        color: "error",
      });
    }
  };

  // API v1 instance
  const apiv1 = $fetch.create({
    baseURL: `${config.public.apiBaseUrl as string}/api/v1`,
    onRequest,
    onResponseError,
  });

  return {
    provide: {
      apiv1,
    },
  };
});