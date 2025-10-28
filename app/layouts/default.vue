<script lang="ts" setup>

import zeboMainLogo from "~/assets/images/logos/zebo-main-logo.png";
import type { NavigationMenuItem } from '@nuxt/ui';

const items: NavigationMenuItem[][] = [
  [
    {
      label: 'General',
      icon: 'i-lucide-user',
      active: true
    },
    {
      label: 'Members',
      icon: 'i-lucide-users'
    },
    {
      label: 'Notifications',
      icon: 'i-lucide-bell'
    }
  ]
  // [
  //   {
  //     label: 'Documentation',
  //     icon: 'i-lucide-book-open',
  //     to: 'https://ui.nuxt.com/docs',
  //     target: '_blank'
  //   },
  //   {
  //     label: 'Help & Feedback',
  //     icon: 'i-lucide-help-circle',
  //     to: 'https://github.com/nuxt/ui/issues',
  //     target: '_blank'
  //   }
  // ]
]
</script>

<template>
  <UDashboardGroup>
   <UDashboardPanel resizable>
     <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="me-3">
            <img :src="zeboMainLogo" alt="ZE  BO" class="w-33 h-10">

          </div>
        
      </template>
      <template #trailing>
        <UNavigationMenu :items="items" highlight class="flex-1" />
      </template>
        <!-- <template #left> -->

        <!-- </template> -->
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- <Placeholder class="h-full" /> -->
    <slot />

    </template>
  </UDashboardPanel>
    <!-- <UDashboardNavbar>
     <template #title>
       <img :src="zeboMainLogo" alt="ZE  BO" class="w-33 h-10">
 
     <template #trailing>
     </template>

 
     <template #right>
       <UTabs :items="items" default-value="all" size="sm" class="w-40" :content="false" />
     </template>
   </UDashboardNavbar> -->
  </UDashboardGroup>
</template>
