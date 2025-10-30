import { z } from 'zod';

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
type AuthResponse = z.output<typeof AuthResponseSchema>;


const LoginCredentialsSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string('Password is required').min(4, 'Must be at least 8 characters'),
});

type LoginCredentials = z.output<typeof LoginCredentialsSchema>;


const loginAction = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { $apiv1 } = useNuxtApp();
  const payload = new URLSearchParams()
  payload.append("grant_type", "password"); 
  payload.append("username", credentials.email);
  payload.append("password", credentials.password);

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
// Interface for the MSAL token payload
const SsoExchangePayloadSchema = z.object({
  id_token: z.string().min(1, "ID token is required"),
  contact: z.object({
    name: z.string().min(1, "Name is required"),
    username: z.string().min(1, "Username is required"),
  }),
});
export type SsoExchangePayload = z.output<typeof SsoExchangePayloadSchema>;

// Function to exchange the MSAL token for your backend token
// Note: This assumes your client-side backend's SSO endpoint also accepts JSON.
// If it expects form data like loginAction, we'll need to adjust.
const exchangeSsoToken = async (payload: SsoExchangePayload): Promise<AuthResponse> => {
  const validatedPayload = SsoExchangePayloadSchema.parse(payload);
  const { $apiv1 } = useNuxtApp();
  
  // We use $apiv1 to match your project's structure
  const response = await $apiv1<AuthResponseInput>("/auth/azure/sso-exchange/token", {
    method: "POST",
    body: validatedPayload,
  });
  const data = AuthResponseSchema.parse(response);
  return data;
};

export { 
  loginAction, 
  exchangeSsoToken, // export the new function
  AuthResponseSchema, 
  LoginCredentialsSchema, 
  type LoginCredentials, 
  type AuthResponse
 };
