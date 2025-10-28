import type { FetchContext } from "ofetch";

export default defineNuxtPlugin(() => {
  const token = localStorage.getItem("zebo-auth");;
  const config = useRuntimeConfig();
  const toast = useToast();

  // Common request interceptor
  const onRequest = ({ options }: FetchContext) => {
    if (token) {
      options.headers?.set("Authorization", `Bearer ${token}`);
    }
  };

  // Common response error handler
  const onResponseError = async ({ error, response }: FetchContext) => {
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

  // API v2 instance
  //   const apiv2 = $fetch.create({
  //     baseURL: config.public.apiV2Base as string,
  //     onRequest,
  //     onResponseError,
  //     timeout: 15000,
  //     retry: 2,
  //   });

  return {
    provide: {
      apiv1,
    },
  };
});
