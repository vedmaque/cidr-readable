<script setup lang="ts">
import { MODES } from '@/features/converter/modes'
</script>

<template>
  <nav aria-label="Conversion mode">
    <ul
      class="grid grid-cols-3 gap-1 rounded-xl bg-zinc-200/70 p-1 sm:inline-flex dark:bg-zinc-900"
    >
      <li v-for="mode in MODES" :key="mode.id" class="flex">
        <RouterLink
          :to="{ name: mode.id }"
          class="flex flex-1 items-center justify-center rounded-lg px-2 py-1.5 text-center text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-teal-600 sm:px-3 sm:text-sm sm:whitespace-nowrap dark:text-zinc-400 dark:hover:text-zinc-100"
          exact-active-class="bg-white !text-zinc-900 shadow-sm dark:bg-zinc-700 dark:!text-white"
        >
          {{ mode.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
