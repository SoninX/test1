import { useMutation } from "@pinia/colada";
import { loginAction, /* exchangeSsoToken, */ type SsoExchangePayload, type LoginCredentials, type AuthResponse } from "~/composables/api/auth";
import { navigateTo } from '#app';
import type { AuthenticationResult, PublicClientApplication } from '@azure/msal-browser';
import { BrowserAuthError } from '@azure/msal-browser';

// Declare $msalInstance on the NuxtApp
declare module '#app' {
  interface NuxtApp {
    $msalInstance: PublicClientApplication
  }
}

// Helper: Define the shape of the data we store in localStorage
interface AuthStorage {
  data: AuthResponse;
  exp: number;
  iat: number;
  user_id: string;
}

// Helper: JWT Parser (moved from your login.vue)
interface JwtPayloadBase {
  sub?: string
  exp?: number
  iat?: number
  [key: string]: unknown
}
function parseJwt<T extends JwtPayloadBase = JwtPayloadBase>(
  token: string
): T | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    return JSON.parse(jsonPayload) as T
  } catch {
    return null
  }
}

// Define the MSAL login request scopes
const msalLoginRequest = {
  scopes: ["User.Read", "email", "openid", "profile"],
};

export const useAuthStore = defineStore("auth", () => {
  
  // --- Getters ---
  const isAuthenticated = computed(() => {
    if (import.meta.client) {
      const authData = localStorage.getItem("zebo-auth");
      if (!authData) return false;

      try {
        const parsedData: AuthStorage = JSON.parse(authData);
        // Check if token exists and is not expired
        return !!parsedData.data.accessToken && parsedData.exp * 1000 > Date.now();
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  // --- Helper function to save session ---
  // This is based on your login.vue's onSuccess handler
  const saveSession = (response: AuthResponse) => {
    const tokenData = parseJwt(response.accessToken);
    if (!tokenData || !tokenData.exp || !tokenData.iat || !tokenData.sub) {
      console.error('Failed to parse JWT or token data is missing');
      return;
    }

    const authData: AuthStorage = {
      data: response,
      exp: tokenData.exp,
      iat: tokenData.iat,
      user_id: tokenData.sub
    };
    
    if (import.meta.client) {
      localStorage.setItem("zebo-auth", JSON.stringify(authData));
    }
  };

  // --- Actions ---
  
  // Regular email/password login
  const loginMutation = () => {
    return useMutation<AuthResponse, LoginCredentials>({
      key: ["login"],
      mutation: (credentials: LoginCredentials) => loginAction(credentials),
      onSuccess: (response: AuthResponse) => {
        saveSession(response);
      },
    });
  };
  
  // New SSO login
  const ssoLoginMutation = () => {
    const { $msalInstance } = useNuxtApp();
    const toast = useToast();

    return useMutation<AuthResponse, undefined>({
      key: ['ssoLogin'],
      mutation: async () => {
        try {
          const msalResponse: AuthenticationResult = await $msalInstance.loginPopup(msalLoginRequest);
          
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

          // --- 4. MOCK BACKEND CALL (backend not ready) ---
          // When your FastAPI /auth/sso-exchange endpoint is ready,
          // you can uncomment the real call below and remove the mock.
          
          // const fastapiResponse = await exchangeSsoToken(exchangePayload);
          // return fastapiResponse;

          // --- Mock Response (using the Zod-transformed AuthResponse type) ---
          const mockFastApiResponse: AuthResponse = {
            accessToken: "mock-fastapi-access-token",
            refreshToken: "mock-fastapi-refresh-token",
            tokenType: "bearer"
          };
          
          // We need a *real* mock JWT to test the full flow
          // This is a base64-encoded JWT with: { "sub": "mock-user-id", "exp": [1 hour from now], "iat": [now] }
          const now = Math.floor(Date.now() / 1000);
          const exp = now + 3600;
          const mockPayload = btoa(JSON.stringify({ sub: "mock-sso-user", exp: exp, iat: now }));
          mockFastApiResponse.accessToken = `mock-header.${mockPayload}.mock-signature`;

          return mockFastApiResponse;
          // --- End of Mock ---

        } catch (error) {
          console.error("SSO Mutation Error:", error);

          if (error instanceof BrowserAuthError && (error.errorCode.includes("popup_window_error") || error.errorCode.includes("user_cancelled"))) {
             toast.add({ title: "Login cancelled", description: "The login popup was closed. Please try again.", color: "info" });
             throw new Error("Login popup was closed. Please try again.");
          }

          throw new Error("SSO login failed. Please try again.");
        }
      },
      onSuccess: (response: AuthResponse) => {
        saveSession(response);
        console.log("Backend response saved to localStorage:", response);
      },
    });
  };

  // Logout action
  const logout = async () => {
    if (import.meta.client) {
      localStorage.removeItem("zebo-auth");
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