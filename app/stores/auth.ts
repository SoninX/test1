import { useMutation } from "@pinia/colada";
// Note: Assuming 'AuthResponse' from auth.ts is the Zod-transformed { accessToken, refreshToken, tokenType }
import { loginAction, type SsoExchangePayload, exchangeSsoToken /* comment this for mocking fastapi response */, type LoginCredentials, type AuthResponse } from "~/composables/api/auth";
import { navigateTo } from '#app';
import type { AuthenticationResult, PublicClientApplication } from '@azure/msal-browser';
import { BrowserAuthError } from '@azure/msal-browser';

// Declare $msalInstance on the NuxtApp
declare module '#app' {
  interface NuxtApp {
    $msalInstance: PublicClientApplication
  }
}

// Define the MSAL login request scopes
const msalLoginRequest = {
  scopes: ["User.Read", "email", "openid", "profile"],
};

// Define the expected shape of the response from *your* backend after login/SSO exchange
// This is what we'll store in localStorage
interface BackendAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  // Include other user details if your backend sends them
  name?: string;
  username?: string;
}


export const useAuthStore = defineStore("auth", () => {

  // --- Getters ---
  const isAuthenticated = computed(() => {
    // **MODIFIED: Check localStorage for the access token**
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem("accessToken");
      return !!accessToken; // Returns true if the token string exists
    }
    return false; // On server-side, assume not authenticated
  });

  // --- Helper function to save session using localStorage ---
  const saveSession = (response: BackendAuthResponse) => {
    // **USING localStorage as requested**
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", response.access_token);
      localStorage.setItem("refreshToken", response.refresh_token);

      // Optional: Store non-sensitive user info
      if (response.name || response.username) {
        const userInfo = {
           name: response.name,
           username: response.username
        };
        localStorage.setItem("zebo-user-info", JSON.stringify(userInfo));
     }
    }
  };

  // --- Actions ---

  // Regular email/password login
  const loginMutation = () => {
    return useMutation<BackendAuthResponse, LoginCredentials>({
      key: ["login"],
      mutation: async (credentials: LoginCredentials): Promise<BackendAuthResponse> => {
        // This assumes loginAction returns the Zod-transformed { accessToken, ... }
        const response: AuthResponse = await loginAction(credentials);
        
        // Map from Zod's camelCase output to the snake_case interface
        return {
          access_token: response.accessToken,
          refresh_token: response.refreshToken,
          token_type: response.tokenType
        };
      },
      onSuccess: (response: BackendAuthResponse) => {
        saveSession(response);
      },
    });
  };

  // New SSO login
  const ssoLoginMutation = () => {
    const { $msalInstance } = useNuxtApp();
    const toast = useToast();

    return useMutation<BackendAuthResponse, undefined>({
      key: ['ssoLogin'],
      mutation: async (): Promise<BackendAuthResponse> => {
        try {
          const msalResponse: AuthenticationResult = await $msalInstance.loginPopup(msalLoginRequest);

          if (!msalResponse || !msalResponse.accessToken || !msalResponse.idToken || !msalResponse.account) {
            throw new Error("MSAL login failed or returned missing token/account data.");
          }

          const exchangePayload: SsoExchangePayload = {
            id_token: msalResponse.idToken,
            contact: {
              name: msalResponse.account.name || "Unknown User",
              username: msalResponse.account.username || "unknown@user.com",
            }
          };

          // --- 4. MOCK BACKEND CALL (backend not ready) ---
          
          const fastapiResponse = await exchangeSsoToken(exchangePayload);
          return {
            access_token: fastapiResponse.accessToken,
            refresh_token: fastapiResponse.refreshToken,
            token_type: fastapiResponse.tokenType
          };

          // // --- Mock Response (matching BackendAuthResponse shape) ---
          
          // // **FIX: Use exchangePayload in the mock to resolve ESLint error**
          // const mockFastApiResponse: BackendAuthResponse = {
          //   access_token: "mock-fastapi-access-token-" + Date.now(),
          //   refresh_token: "mock-fastapi-refresh-token-" + Date.now(),
          //   token_type: "bearer",
          //   // Add mock user details from the payload
          //   name: exchangePayload.contact.name,
          //   username: exchangePayload.contact.username
          // };
          
          // console.log("Using Mock Backend Response:", mockFastApiResponse);
          // return mockFastApiResponse;
          // // --- End of Mock ---

        } catch (error) {
          console.error("SSO Mutation Error:", error);
          if (error instanceof BrowserAuthError && (error.errorCode.includes("popup_window_error") || error.errorCode.includes("user_cancelled"))) {
             toast.add({ title: "Login cancelled", description: "The login popup was closed.", color: "info" });
             throw new Error("Login popup was closed."); // Re-throw specific error
          }
          // Throw a generic error for other issues
          throw new Error("SSO login failed. Please try again.");
        }
      },
      onSuccess: (response: BackendAuthResponse) => {
        saveSession(response);
        console.log("Mock backend response saved to localStorage:", response); // Updated log
      },
    });
  };

  // Logout action - updated to clear localStorage
  const logout = async () => {
    // **MODIFIED: Clear localStorage**
    if (import.meta.client) { // (same as typeof window !== 'undefined')
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("zebo-user-info");
    }

    // Also clear cookies just in case they were set accidentally
    const accessTokenCookie = useCookie("access_token");
    const refreshTokenCookie = useCookie("refresh_token");
    accessTokenCookie.value = null;
    refreshTokenCookie.value = null;

    // MSAL logout
    const { $msalInstance } = useNuxtApp();
    if ($msalInstance.getActiveAccount()) {
      try {
        await $msalInstance.logoutPopup();
      } catch (e) {
        console.error("MSAL logout error:", e);
      }
    }

    // Redirect to login
    await navigateTo('/auth/login');
  };

  return {
    loginMutation,
    ssoLoginMutation,
    logout,
    isAuthenticated,
  };
});