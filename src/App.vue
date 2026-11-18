<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import FormatReference from '@/components/layout/FormatReference.vue'
import ModeNav from '@/components/layout/ModeNav.vue'
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
    <AppHeader />
    <main class="flex flex-col gap-4">
      <ModeNav />
      <RouterView v-slot="{ Component, route }">
        <component :is="Component" :key="route.name" />
      </RouterView>
    </main>
    <footer class="mt-auto border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <FormatReference />
    </footer>
  </div>
</template>
