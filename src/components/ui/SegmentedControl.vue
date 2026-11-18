<script setup lang="ts" generic="T extends string">
defineProps<{
  label: string
  options: readonly { value: T; label: string }[]
}>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="inline-flex rounded-lg bg-zinc-100 p-0.5 text-sm dark:bg-zinc-800"
  >
    <label
      v-for="option in options"
      :key="option.value"
      class="cursor-pointer rounded-md px-2.5 py-1 font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-teal-600"
      :class="
        model === option.value
          ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-white'
          : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
      "
    >
      <input v-model="model" type="radio" class="sr-only" :value="option.value" />
      {{ option.label }}
    </label>
  </div>
</template>
