<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { loginAction, LoginCredentialsSchema, type AuthResponse, type LoginCredentials } from "~/composables/api/auth";
import zeboMainLogo from "~/assets/images/logos/zebo-main-logo.png";

definePageMeta({
  layout: "auth",
});

useSeoMeta({
  title: "Login",
  description: "Login to your account to continue",
});

const toast = useToast();

// const fields = [
//   {
//     name: "email",
//     type: "text" as const,
//     label: "Email",
//     placeholder: "Enter your email",
//     required: true,
//   },
//   {
//     name: "password",
//     label: "Password",
//     type: "password" as const,
//     placeholder: "Enter your password",
//   },
//   {
//     name: "remember",
//     label: "Remember me",
//     type: "checkbox" as const,
//   },
// ];

// const providers = [
//   {
//     label: "Microsoft",
//     icon: "i-simple-icons-microsoft",
//     onClick: () => {
//       toast.add({ title: "Microsoft", description: "Login with Microsoft" });
//     },
//   },
// ];

// const LoginCredentialsSchema = z.object({
//   email: z.email("Invalid email"),
//   password: z.string('Password is required').min(4, 'Must be at least 8 characters'),
// });

// export type LoginCredentials = z.output<typeof LoginCredentialsSchema>;

interface JwtPayloadBase {
  sub?: string
  exp?: number
  iat?: number
  [key: string]: unknown
}

const state = reactive({
  email: '',
  password: ''
})
const showPassword = ref(false)

const isEmailValid = computed(() => {
  if (!state.email) return null
  return LoginCredentialsSchema.shape.email.safeParse(state.email).success
})

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


const { 
  mutate: userLogin, 
  error: isError,
  isLoading: authLoading,
 } = useMutation({
  mutation: (payload: LoginCredentials) => loginAction(payload),
  onSuccess(data : AuthResponse) {
  const tokenData = parseJwt(data.accessToken)
  console.log('parsed token', tokenData);
  
  if (!tokenData){
    console.log('token data not found'); 
    return false
  }
  localStorage.setItem('zebo-auth', JSON.stringify({
    data,
    exp: tokenData.exp,
    iat: tokenData.iat,
    user_id: tokenData.sub
  }))
  navigateTo('/', { replace: true })
  toast.add({ title: 'Success', description: 'Login successful.', color: 'success' })
  
},

  onError() {
    toast.add({ title: 'Error', description: String(isError.value) || 'Failed to create todo', color: 'error' })
    localStorage.removeItem('zebo-auth')
  },

})



function onSubmit(event: FormSubmitEvent<LoginCredentials>) {
  userLogin(event.data)
}

// Add the SSO function
function signInWithSSO() {
  toast.add({ title: "SSO", description: "Sign in with SSO" })
}
// function parseJwt (token:string) {
//   const base64Url = token.split('.')[1] || ""
//   const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
//   const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
//     return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
//   }).join(''))

//   return JSON.parse(jsonPayload)
// }

// function onSubmit(payload: FormSubmitEvent<Schema>) {
//   console.log("Submitted", payload);
// }
</script>

<template>
  <!-- <div class="flex flex-col items-center justify-center gap-4 p-4"> -->
    <UPageCard class="w-full max-w-md rounded-2xl p-7">
      <!-- <UAuthForm
        :schema="LoginCredentialsSchema"
        :fields="fields"
        :providers="providers"
        :loading="authLoading"
        icon="i-lucide-lock"
        description="Welcome back! Please fill the details to login"
        @submit="(event : FormSubmitEvent<LoginCredentials>) => userLogin(event.data)"
      >
      <template #title>
        <img :src="zeboMainLogo" alt="ZE  BO" class="">
        <p class="text-gray-500 text-sm mt-2">Welcome back! Please fill the details to login</p>
  </template>
        <template #password-hint>
          <ULink to="/" class="text-primary font-medium" tabindex="-1"
            >Forgot password?</ULink
          >
        </template>
      </UAuthForm> -->
      
      <!-- Form -->
      <UForm
      :schema="LoginCredentialsSchema" :state="state" 
      @submit="onSubmit">
      <div class="mb-6">
        <img :src="zeboMainLogo" alt="ZE  BO" class="w-35 h-12">
        <p class="text-gray-400 text-sm mt-2">Welcome back! Please fill the details to login</p>
    </div> 
      <UFormField
      label="Email ID" name="email" class="mb-4">
        <UInput 
          v-model="state.email" 
          placeholder="Enter your email"
          class="w-full content"
          variant="soft"
        >
          <!--@blur="emailTouched = true"-->
        <template #trailing>
          <UIcon
            v-if="isEmailValid === true"
            name="i-mdi-check-circle"
            class="text-green-500 w-5 h-5"
          />
          <UIcon
            v-else-if="isEmailValid === false"
            name="i-mdi-close-circle"
            class="text-red-500 w-5 h-5"
          />
      </template>
      </UInput>
      </UFormField>

      <UFormField 
      label="Password" name="password" class="mb-2">
      <UInput
        v-model="state.password"
        variant="soft"
        placeholder="Enter password"
        class="w-full"
        :type="showPassword ? 'text' : 'password'"
        :ui="{ trailing: 'pe-1' }"
      >
      <template #trailing>
      <UButton
        color="neutral"
        variant="link"
        size="sm"
        :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
        :aria-pressed="showPassword"
        aria-controls="password"
        @click="showPassword = !showPassword"
      />
      </template>
      </UInput>
      </UFormField>

      <div class="text-right mb-6">
        <ULink to="/forgot-password" class="text-sm text-dark">
          Forgot Password?
        </ULink>
      </div>

      <UButton 
        type="submit" 
        color="primary" 
        size="lg"
        label="Login"
        block
        :loading="authLoading"
        >
        Login
      </UButton>

      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>

      <UButton 
        color="primary" 
        variant="outline"
        size="lg"
        label= "Microsoft SSO"
        icon= "i-simple-icons-microsoft"
        block
        @click="signInWithSSO"
      >
        <!-- Signin with SSO -->
      </UButton>
    </UForm>
    </UPageCard>
</template>
