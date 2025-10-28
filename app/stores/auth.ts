// app/stores/auth.ts

import { useMutation } from "@pinia/colada";
import { loginUser, exchangeSsoToken, type SsoExchangePayload } from "~/api/auth"; // Import the new type
import { navigateTo } from '#app';
import type { AuthenticationResult, PublicClientApplication } from '@azure/msal-browser';
import { InteractionRequiredAuthError, BrowserAuthError } from '@azure/msal-browser';

declare module '#app' {
  interface NuxtApp {
    $msalInstance: PublicClientApplication
  }
}
export interface LoginCredentials {
  email: string;
  password: string;
}
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  [key: string]: any;
}

const msalLoginRequest = {
  scopes: ["User.Read", "email", "openid", "profile"],
};

export const useAuthStore = defineStore("auth", () => {
  // Getters
  const isAuthenticated = computed(() => {
    const accessToken = useCookie("access_token");
    return !!accessToken.value;
  });

  // --- Helper function to save session ---
  const saveSession = (response: LoginResponse) => {
    const accessToken = useCookie("access_token");
    const refreshToken = useCookie("refresh_token");

    // We only want the *backend response* token stored.
    accessToken.value = response.access_token;
    refreshToken.value = response.refresh_token;

    if (process.client) {
      localStorage.setItem("login_response", JSON.stringify(response));
      sessionStorage.setItem("fastapi_token", response.access_token);
    }
    // IMPORTANT: Per your request, the MSAL tokens are NOT stored here.
  };

  // Actions
  const loginMutation = () => {
    return useMutation<LoginResponse, LoginCredentials>({
      key: ["login"],
      mutation: (credentials: LoginCredentials) => loginUser(credentials),
      onSuccess: (response: LoginResponse) => {
        saveSession(response);
      },
    });
  };
  
  const ssoLoginMutation = () => {
    const { $msalInstance } = useNuxtApp();
    const toast = useToast();

    return useMutation<LoginResponse, void>({
      key: ['ssoLogin'],
      mutation: async () => {
        try {
          const msalResponse: AuthenticationResult = await $msalInstance.loginPopup(msalLoginRequest);
          
          console.log("MSAL Response from Microsoft (Source of Tokens/Info):", msalResponse);

          if (!msalResponse || !msalResponse.accessToken || !msalResponse.idToken || !msalResponse.account) {
            throw new Error("MSAL login failed or returned missing token/account data.");
          }

          const exchangePayload: SsoExchangePayload = {
            access_token: msalResponse.accessToken,
            id_token: msalResponse.idToken,
            contact: {
              name: msalResponse.account.name || "Unknown User",
              username: msalResponse.account.username || "unknown@user.com",
            }
          };

          console.log("Payload sent to backend (mocked):", exchangePayload);

          // --- 4. MOCK BACKEND CALL (backend not ready) ---
          // When your FastAPI /auth/sso-exchange endpoint is ready,
          // you can uncomment the real call below and remove the mock.

          // const fastapiResponse = await exchangeSsoToken(exchangePayload);
          // return fastapiResponse;

          // --- Mock Response ---
          const mockFastApiResponse: LoginResponse = {
            access_token: "mock-fastapi-access-token",
            refresh_token: "mock-fastapi-refresh-token",
            user: exchangePayload.contact.name,
            email: exchangePayload.contact.username,
            // Include the data that the backend would normally return after validation
          };
          
          return mockFastApiResponse;
          // --- End of Mock ---

        } catch (error) {
          console.error("SSO Mutation Error:", error);

          // Handle common MSAL errors (like user closing the popup)
          if (error instanceof BrowserAuthError && (error.errorCode.includes("popup_window_error") || error.errorCode.includes("user_cancelled"))) {
             toast.add({ title: "Login cancelled", description: "The login popup was closed. Please try again.", color: "info" });
             throw new Error("Login popup was closed. Please try again.");
          }

          // Handle other errors
          throw new Error("SSO login failed. Please try again.");
        }
      },
      onSuccess: (response: LoginResponse) => {
        // This will now run with the mock response
        saveSession(response);
        console.log("Backend response saved to session/cookies:", response);
      },
    });
  };

  const logout = async () => {
    const accessToken = useCookie("access_token");
    const refreshToken = useCookie("refresh_token");

    accessToken.value = null;
    refreshToken.value = null;

    if (process.client) {
      localStorage.removeItem("login_response");
      sessionStorage.removeItem("fastapi_token");
    }

    const { $msalInstance } = useNuxtApp();
    if ($msalInstance.getActiveAccount()) {
      await $msalInstance.logoutPopup();
    }

    await navigateTo('/auth/login');
  };

  return {
    loginMutation,
    ssoLoginMutation,
    logout,
    isAuthenticated,
  };
});