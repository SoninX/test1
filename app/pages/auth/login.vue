<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
// Import the schema from the composable, but the store will handle the rest
import { LoginCredentialsSchema, type LoginCredentials } from "~/composables/api/auth";
import zeboMainLogo from "~/assets/images/logos/zebo-main-logo.png";
import { useAuthStore } from "~/stores/auth"; // Import the new store

definePageMeta({
  layout: "auth",
});

useSeoMeta({
  title: "Login",
  description: "Login to your account to continue",
});

// --- Type Guards for Error Handling ---

// This checks for API errors that have a nested `data.message` (e.g., 422 Validation Error)
interface FetchApiError {
  data: {
    message: string;
  };
}

function isFetchApiError(error: unknown): error is FetchApiError {
  // 1. Check if the top-level error is an object and has a 'data' property
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return false;
  }

  // 2. Now that we know 'data' exists, extract it.
  const data = (error as { data: unknown }).data;

  // 3. Check if the nested 'data' property is *also* an object
  //    and contains the 'message' property.
  return (
    typeof data === "object" &&
    data !== null &&
    "message" in data
  );
}

// This checks for generic $fetch errors (like network errors) or standard JS Errors
interface GenericError {
    message: string;
}

function isGenericError(error: unknown): error is GenericError {
    return (
        typeof error === "object" &&
        error !== null &&
        "message" in error
    );
}

// --- End Type Guards ---

const toast = useToast();
const router = useRouter(); // Use router for navigation
const authStore = useAuthStore(); // Initialize the store

// Get the login mutation from the store (like in the admin app)
const { 
  mutateAsync: userLogin, 
  isLoading: authLoading,
  error: loginError
} = authStore.loginMutation();

// Get the SSO login mutation from the store (like in the admin app)
const { 
  mutateAsync: ssoLogin, 
  isLoading: isSsoLoading 
} = authStore.ssoLoginMutation();

const state = reactive({
  email: '',
  password: ''
})
const showPassword = ref(false)

const isEmailValid = computed(() => {
  if (!state.email) return null
  return LoginCredentialsSchema.shape.email.safeParse(state.email).success
})

// Submit handler (uses store logic, like in the admin app)
async function onSubmit(event: FormSubmitEvent<LoginCredentials>) {
  try {
    await userLogin(event.data); // Call the store's mutation
    
    // Handle success
    toast.add({ title: 'Success', description: 'Login successful.', color: "primary" });
    await router.push('/'); // Use router to navigate

  } catch (err: unknown) {
    console.error("Login error:", err);
    let errorMessage = "Please check your credentials.";

    if (isFetchApiError(err)) {
      // Handles 422 Validation Errors, uses the specific API message
      errorMessage = err.data.message;
    } else if (isGenericError(err)) {
      // Handles network errors or other $fetch errors
      errorMessage = err.message;
    }

    toast.add({ 
      title: 'Login failed', 
      description: errorMessage, 
      color: 'error' 
    });
  }
}

// SSO handler (uses store logic, like in the admin app)
async function signInWithSSO() {
  try {
    await ssoLogin(undefined); // Call the store's SSO mutation

    toast.add({
      title: "Login successful!",
      color: "primary",
    });

    await router.push("/"); // Navigate on success

  } catch (err: unknown) {
    console.error("SSO Login error:", err);
    let errorMessage = "An unknown error occurred.";

    // Check if it's a standard Error object
    if (err instanceof Error) {
      errorMessage = err.message;
    }

    toast.add({
      title: "SSO Login failed",
      description: errorMessage,
      color: "error",
    });
  }
}
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
