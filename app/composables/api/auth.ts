import { z } from 'zod';
import type { BackendAuthResponse } from "~/stores/auth";
// Schema for the response *from*  backend
const AuthResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  refresh_token: z.string(),
}).transform(data => ({
  accessToken: data.access_token,
  tokenType: data.token_type,
  refreshToken: data.refresh_token,
}));

type AuthResponseInput = z.input<typeof AuthResponseSchema>;
export type AuthResponse = z.output<typeof AuthResponseSchema>; // Export AuthResponse

export interface RefreshTokenPayload{
  refresh_token:string;
}

// Schema for regular login credentials
export const LoginCredentialsSchema = z.object({ // Export LoginCredentialsSchema
  email: z.email("Invalid email"),
  password: z.string().min(4, 'Password must be at least 4 characters'), // Adjusted min length to match example
});

export type LoginCredentials = z.output<typeof LoginCredentialsSchema>; // Export LoginCredentials


// Schema for the payload sent *to* your backend for SSO exchange
// *** MODIFIED: Only includes id_token ***
const SsoExchangePayloadSchema = z.object({
  id_token: z.string().min(1, "ID token is required"),
});
export type SsoExchangePayload = z.output<typeof SsoExchangePayloadSchema>; // Export SsoExchangePayload


// Regular Login Action (remains the same)
export const loginAction = async (credentials: LoginCredentials): Promise<AuthResponse> => { // Export loginAction
  const { $apiv1 } = useNuxtApp(); // Assuming auth uses apiv1
  const payload = new URLSearchParams();
  payload.append("grant_type", "password");
  payload.append("username", credentials.email);
  payload.append("password", credentials.password);

  // Assuming your login endpoint is /auth/token
  const response= await $apiv1<AuthResponseInput>("/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
  });
  const data = AuthResponseSchema.parse(response);
  return data;
};


// Function to exchange the MSAL ID token for your backend token
export const exchangeSsoToken = async (payload: SsoExchangePayload): Promise<AuthResponse> => { // Export exchangeSsoToken
  // Validate the payload against the updated schema (only id_token)
  const validatedPayload = SsoExchangePayloadSchema.parse(payload);
  const { $apiv1 } = useNuxtApp(); // Or $apiv2 if auth uses a different base URL

  // Assuming your SSO exchange endpoint is /auth/azure/sso-exchange/token
  const response = await $apiv1<AuthResponseInput>("/auth/azure/sso-exchange/token", {
    method: "POST",
    body: validatedPayload, // Send only { id_token: "..." }
  });
  const data = AuthResponseSchema.parse(response);
  return data;
};

export const refreshUserToken = (payload: RefreshTokenPayload): Promise<BackendAuthResponse> => {
  const { $apiv1 } = useNuxtApp();
  
  return $apiv1("/refresh", {
    method: "POST",
    body: payload,
  });
};