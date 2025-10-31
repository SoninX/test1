import { useMutation } from "@pinia/colada";
import { loginAction, exchangeSsoToken, type SsoExchangePayload, type LoginCredentials, type AuthResponse } from "~/composables/api/auth";
import { navigateTo } from '#app';
import type { AuthenticationResult, PublicClientApplication } from '@azure/msal-browser';
import { BrowserAuthError } from '@azure/msal-browser';

// Declare $msalInstance on the NuxtApp (remains the same)
declare module '#app' {
  interface NuxtApp {
    $msalInstance: PublicClientApplication
  }
}

// Define the MSAL login request scopes
const msalLoginRequest = {
  scopes: ["User.Read", "email", "openid", "profile"],
};

// Define the expected shape of the response from *your* backen
interface BackendAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  // User details might be included by the backend *after* validating the id_token
  name?: string;
  username?: string;
}


export const useAuthStore = defineStore("auth", () => {

  // --- Getters ( uses localStorage) ---
  const isAuthenticated = computed(() => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem("accessToken");
      return !!accessToken;
    }
    return false;
  });

  // --- Helper function to save session using localStorage ---
  const saveSession = (response: BackendAuthResponse) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", response.access_token);
      localStorage.setItem("refreshToken", response.refresh_token);
      if (response.name || response.username) {
        const userInfo = { name: response.name, username: response.username };
        localStorage.setItem("zebo-user-info", JSON.stringify(userInfo));
     } else {
       // Clear old user info if not present in the new response
       localStorage.removeItem("zebo-user-info");
     }
    }
  };

  // --- Actions ---

  // Regular email/password login (remains the same)
  const loginMutation = () => {
    return useMutation<BackendAuthResponse, LoginCredentials>({
      key: ["login"],
      mutation: async (credentials: LoginCredentials): Promise<BackendAuthResponse> => {
        const response: AuthResponse = await loginAction(credentials);
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

          // Ensure we have the ID token needed for the payload
          if (!msalResponse || !msalResponse.idToken) { // Removed accessToken and account check if not directly needed
            throw new Error("MSAL login failed or returned missing ID token.");
          }

          // *** MODIFIED: Create payload with only id_token ***
          const exchangePayload: SsoExchangePayload = {
            id_token: msalResponse.idToken,
            // REMOVED: contact object
          };

          console.log("Payload sent to backend:", exchangePayload);

          // --- 4. ACTUAL BACKEND CALL ---
          // This will now send only { id_token: "..." }
          const fastapiResponseRaw = await exchangeSsoToken(exchangePayload);
          // Map response if necessary (as done in loginMutation)
          const fastapiResponse: BackendAuthResponse = {
             access_token: fastapiResponseRaw.accessToken,
             refresh_token: fastapiResponseRaw.refreshToken,
             token_type: fastapiResponseRaw.tokenType
             // Assuming backend might add user details after validating id_token
             // name: fastapiResponseRaw.name, // Example if backend adds name
             // username: fastapiResponseRaw.username // Example if backend adds username
          };
          console.log("Actual Backend Response:", fastapiResponse);
          return fastapiResponse;
          // --- End of Actual Call ---

          // --- MOCK RESPONSE (Comment out the actual call above when using this) ---
          // const mockFastApiResponse: BackendAuthResponse = {
          //   access_token: "mock-fastapi-access-token-" + Date.now(),
          //   refresh_token: "mock-fastapi-refresh-token-" + Date.now(),
          //   token_type: "bearer",
          //   // Cannot get name/username from payload anymore, backend would provide these
          //   name: "Mock User",
          //   username: "mock.user@example.com"
          // };
          // console.log("Using Mock Backend Response:", mockFastApiResponse);
          // return mockFastApiResponse;
          // --- End of Mock ---


        } catch (error) {
          console.error("SSO Mutation Error:", error);
          if (error instanceof BrowserAuthError && (error.errorCode.includes("popup_window_error") || error.errorCode.includes("user_cancelled"))) {
             toast.add({ title: "Login cancelled", description: "The login popup was closed.", color: "info" });
             throw new Error("Login popup was closed.");
          }
          throw new Error("SSO login failed. Please try again.");
        }
      },
      onSuccess: (response: BackendAuthResponse) => {
        saveSession(response);
        console.log("Backend response saved to localStorage:", response);
      },
    });
  };

  // Logout action (remains the same - clears localStorage)
  const logout = async () => {
    if (import.meta.client) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("zebo-user-info");
    }

    const accessTokenCookie = useCookie("access_token");
    const refreshTokenCookie = useCookie("refresh_token");
    accessTokenCookie.value = null;
    refreshTokenCookie.value = null;

    const { $msalInstance } = useNuxtApp();
    if ($msalInstance.getActiveAccount()) {
      try {
        await $msalInstance.logoutPopup();
      } catch (e) {
        console.error("MSAL logout error:", e);
      }
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