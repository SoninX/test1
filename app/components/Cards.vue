<script setup lang="ts">
const props = defineProps<{
  title: string;
  description: string;
  loading?: boolean;
}>();
</script>

<template>
  <UPageCard class="w-80" :title="props.title" :description="props.description">
    <!-- <USkeleton v-if="props.loading" class="w-full h-full" /> -->
    <slot />
  </UPageCard>
</template>
