<script setup lang="ts">
const route = useRoute()
const open = ref(false)

// Emit sidebar state to parent
const emit = defineEmits(['sidebar-toggle'])

// Watch for sidebar state changes and emit to parent
watch(open, (newValue) => {
  emit('sidebar-toggle', newValue)
})

// example user
const user = {
  fullname: 'Alex Ray',
  email: 'alex.ray@example.com'
}

// logout function
async function handleLogout() {
  console.log('Attempting to log out...')
  await navigateTo('/login')
}

const userMenuItems = [
  [{
    label: 'Profile',
    icon: 'i-heroicons-user-circle',
    click: () => navigateTo('/profile')
  }, {
    label: 'Settings',
    icon: 'i-heroicons-cog-6-tooth',
    click: () => navigateTo('/settings')
  }],
  [{
    label: 'Logout',
    icon: 'i-heroicons-arrow-left-on-rectangle',
    click: handleLogout
  }]
]

// Close sidebar when route changes on mobile
watch(() => route.path, () => {
  if (window.innerWidth < 768) {
    open.value = false
  }
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      :min-size="12"
      collapsible
      resizable
      class="bg-elevated/50 h-full fixed md:relative z-50"
			:toggle="{
        color: 'primary',
        variant: 'subtle',
        class: 'rounded-full'
      }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2">
          <img 
            v-if="collapsed" 
            src="~/assets/images/logos/logo-abc.png" 
            alt="ar-logo" 
            class="h-8 w-auto"
          >
        </div>
        <div v-if="!collapsed" class="flex items-center gap-1.5 ms-auto">
          <img 
            src="~/assets/images/logos/logo.png" 
            alt="ar-logo" 
            class="h-8 w-auto"
          >
          <UDashboardSidebarCollapse />
        </div>
      </template>

      <template #default="{ collapsed }">
        <div class="flex flex-col gap-1.5 mb-4">
          <UButton
            v-bind="collapsed ? { icon: 'i-heroicons-book-open' } : { icon: 'i-heroicons-book-open',label: 'Ledger' }"
            variant="soft"
            block
            to=""
            @click="open = false"
          /> 
          <UButton
            v-bind="collapsed ? { icon: 'i-heroicons-envelope' } : {icon: 'i-heroicons-envelope', label: 'Mails' }"
            variant="soft"
            block
            to=""
            @click="open = false"
          />
          <UButton
            v-bind="collapsed ? { icon: 'i-heroicons-inbox-stack' } : { icon: 'i-heroicons-inbox-stack', label: 'SOA' }"
            variant="soft"
            block
            to=""
            @click="open = false"
          />
          <UButton
            v-bind="collapsed ? { icon: 'i-heroicons-user' } : { icon: 'i-heroicons-user', label: 'Accounts' }"
            variant="soft"
            block
            to=""
            @click="open = false"
          />
          <UButton
            v-bind="collapsed ? { icon: 'i-heroicons-link' } : { icon: 'i-heroicons-link', label: 'AR Linkage' }"
            variant="soft"
            block
            to=""
            @click="open = false"
          />

          <template v-if="collapsed">
            <UDashboardSidebarCollapse />
          </template>
        </div>
      </template>

      <template #footer="{ collapsed }">
        <UDropdownMenu  :items="userMenuItems" :popper="{ placement: 'top-start' }">
          <UButton variant="ghost" class="w-full">
            <template #leading>
              <UAvatar
                :src="`https://ui-avatars.com/api/?name=${user.fullname}&background=BD6068&color=ffffff&bold=false`"
                size="2xs"
              />
            </template>

            <span v-if="!collapsed" class="truncate text-left">{{ user.fullname }}</span>
          </UButton>
        </UDropdownMenu >
      </template>
    </UDashboardSidebar>
	

    <!-- Main content slot -->
    <slot />
  </UDashboardGroup>
</template>