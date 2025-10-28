<script lang="ts" setup>
import { getUserListData } from "~/composables/api/user";

const { id } = useRoute().params;
const queryCache = useQueryCache();

// Try to get cached data first
const cachedUserList = queryCache.getQueryData<User[]>(["usersList"]);

// Query for user list (will use cache if available, otherwise fetch)
const {
  data: userList,
  isLoading: userListLoading,
  error: userListError,
  refetch,
} = useQuery<User[]>({
  key: ["usersList"],
  query: getUserListData,
  enabled: !cachedUserList, // Only fetch if not cached
});

// Combine cached and fresh data
const allUsers = computed(() => userList.value || cachedUserList || []);

const user = computed(() => {
  const foundUser = allUsers.value?.find((user) => user.id === Number(id));
  return foundUser || ({} as User);
});

// If no user found and not loading, try to refetch
watchEffect(() => {
  if (!user.value.id && !userListLoading.value && !userListError.value) {
    refetch();
  }
});
</script>

<template>
  <UContainer class="flex flex-col mt-3">
    <UPageCard v-if="user.id" :title="user.name" :description="user.email">
      <p class="text-gray-500">{{ user.phone }}</p>
      <p class="text-gray-500">{{ user.website }}</p>
      <UButtonGroup class="flex justify-end gap-2">
        <UButton to="/" icon="i-lucide-chevron-left">Back</UButton>
        <UButton icon="i-lucide-edit">Edit</UButton>
      </UButtonGroup>
    </UPageCard>
    <UAlert v-else-if="userListLoading" title="Loading..." color="primary" />
    <UAlert
      v-else-if="userListError"
      :title="userListError.message"
      color="error"
    />
    <UAlert v-else title="User not found" color="warning" />
  </UContainer>
</template>
