
import { z } from 'zod';

// or z.infer (no difference here since no transform)

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

export { 
  loginAction, AuthResponseSchema, LoginCredentialsSchema, type LoginCredentials, type AuthResponse

 };
