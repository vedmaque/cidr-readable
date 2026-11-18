<script setup lang="ts">
defineProps<{ titleId: string }>()
</script>

<template>
  <section
    :aria-labelledby="titleId"
    class="flex h-[26rem] min-w-0 flex-col rounded-xl border border-zinc-200 bg-white shadow-sm lg:h-[34rem] dark:border-zinc-800 dark:bg-zinc-900"
  >
    <header
      class="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800"
    >
      <slot name="header" />
    </header>
    <slot />
  </section>
</template>
