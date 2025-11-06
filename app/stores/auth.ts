import { useMutation } from "@pinia/colada";
import { loginAction, exchangeSsoToken,refreshUserToken, type SsoExchangePayload, type LoginCredentials, type AuthResponse, type RefreshTokenPayload } from "~/composables/api/auth";
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
export interface BackendAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

const decodeJwtPayload = (token: string): any | null => {
  try {
    const payloadBase64Url = token.split('.')[1];
    if (!payloadBase64Url) {
      throw new Error("Invalid JWT: Missing payload");
    }

    let payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    const padding = payloadBase64.length % 4;
    if (padding) {
      payloadBase64 += '='.repeat(4 - padding);
    }

    const decodedData = atob(payloadBase64);

    const utf8String = decodeURIComponent(
      Array.prototype.map.call(decodedData, (c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    
    return JSON.parse(utf8String);

  } catch (error) {
    console.error("Error decoding JWT payload:", error);
    return null; 
  }
};

export const useAuthStore = defineStore("auth", () => {
  const isRefreshing = ref(false);

  function scheduleRefresh() {
    // Get the auth store (or just call functions directly)
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    if (!tokenExpiry) {
      return; // No expiry, do nothing
    }

    const expiryTimeMs = parseInt(tokenExpiry, 10) * 1000;
    const currentTimeMs = Date.now();
    const bufferMs = 5 * 60 * 1000; // 5 minute buffer
    const delay = (expiryTimeMs - currentTimeMs) - bufferMs;

    if (delay > 0) {
      setTimeout(async () => {
        console.log('Proactive refresh timer triggered.');
        
        // Get the mutation from within the store
        const { mutateAsync: refreshTokenAsync } = refreshTokenMutation();

        try {
          // --- Call 'refreshTokenAsync' ---
          await refreshTokenAsync(); // This will now throw an error if it fails
          
          console.log('Proactive refresh successful.');
          // After a successful refresh, schedule the *next* refresh
          scheduleRefresh(); 

        } catch (error: any) {
          // --- Move all error logic into the catch block ---
          if (error.message.includes('Refresh already in progress')) {
            console.warn('Proactive refresh skipped: Refresh already in progress.');
          } else {
            console.error('Proactive refresh failed:', error);
            logout();
          }
        }
      }, delay);
    } else {
      console.warn('Token is already expired or within buffer. Skipping proactive refresh.');
    }
  }

  // --- Helper function to save session using localStorage ---
  const saveSession = (response: BackendAuthResponse) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", response.access_token);
      localStorage.setItem("refreshToken", response.refresh_token);
      localStorage.setItem("type",response.token_type);

      try {
    const decodedPayload = decodeJwtPayload(response.access_token);
    console.log(decodedPayload)
    if (decodedPayload) {
      const userInfo = {
        name: decodedPayload.name,
        username: decodedPayload.username || decodedPayload.email,
        role: decodedPayload.roles,
      };
        
        // 4. Save the decoded user info as a JSON string
        localStorage.setItem("zebo-user-info", JSON.stringify(userInfo));

        if (decodedPayload.exp) {
            localStorage.setItem("tokenExpiry", decodedPayload.exp);
          } else {
            localStorage.removeItem("tokenExpiry");
          }

      } else {
        console.warn("Could not decode JWT payload. Clearing local user info.");
        localStorage.removeItem("zebo-user-info");
        localStorage.removeItem("tokenExpiry");
      }
    } catch (error) {
      console.error("Failed to parse token or save session:", error);
      localStorage.removeItem("zebo-user-info");
      localStorage.removeItem("tokenExpiry");
    }
  }
  };

    // --- Getters ( uses localStorage) ---
  const isAuthenticated = computed(() => {
    const accessToken = (typeof window !== 'undefined') ? localStorage.getItem("accessToken") : null;
    return !!accessToken;
  });
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
        scheduleRefresh();
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
        scheduleRefresh();
      },
    });
  };

  const refreshTokenMutation = () => {
    return useMutation<BackendAuthResponse, void>({
      key: ['refreshToken'],
      // We use a custom mutation function to handle the isRefreshing state
      mutation: async (): Promise<BackendAuthResponse> => {
        // 1. Check if a refresh is already in progress
        if (isRefreshing.value) {
          // If so, throw an error to stop this mutation
          throw new Error("Refresh already in progress.");
        }

        // 2. Set the refreshing state
        isRefreshing.value = true;

        // 3. Get the refresh token from storage
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available.");
        }

        // 4. Call the API
        const payload: RefreshTokenPayload = { refresh_token: refreshToken };
        return await refreshUserToken(payload);
      },
      onSuccess: (response: BackendAuthResponse) => {
        // 5. On success, save the new session (new tokens and new expiry)
        saveSession(response);
      },
      // 6. onSettled runs after onSuccess OR onError
      onSettled: () => {
        // 7. Always reset the refreshing state
        isRefreshing.value = false;
      },
    });
  };
  // Logout action (remains the same - clears localStorage)
  const logout = async () => {
    if (import.meta.client) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("zebo-user-info");
      localStorage.removeItem("tokenExpiry");
      localStorage.removeItem("tokenType");
    }

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

  const initSessionWatcher = () => {
    if (import.meta.client) {
      scheduleRefresh();
    }
  }

  return {
    loginMutation,
    ssoLoginMutation,
    refreshTokenMutation,
    logout,
    initSessionWatcher,
    isAuthenticated,
    isRefreshing,
  };
});