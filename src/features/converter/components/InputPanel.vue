<script setup lang="ts">
import { useId } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PanelCard from './PanelCard.vue'

defineProps<{
  label: string
  placeholder: string
  example: string
}>()
const model = defineModel<string>({ required: true })

const id = useId()
const titleId = `${id}-title`
const inputId = `${id}-input`
</script>

<template>
  <PanelCard :title-id="titleId">
    <template #header>
      <h2 :id="titleId" class="text-sm font-semibold">
        <label :for="inputId">{{ label }}</label>
      </h2>
      <div class="flex gap-1">
        <BaseButton @click="model = example">Example</BaseButton>
        <BaseButton :disabled="model === ''" @click="model = ''">Clear</BaseButton>
      </div>
    </template>
    <textarea
      :id="inputId"
      v-model="model"
      :placeholder="placeholder"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      class="min-h-0 flex-1 resize-none rounded-b-xl bg-transparent p-3 font-mono text-sm leading-6 placeholder:text-zinc-400 focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 dark:placeholder:text-zinc-600"
    />
    <slot />
  </PanelCard>
</template>
