<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import BaseButton from './BaseButton.vue'

const props = defineProps<{ text: string }>()

const { copy, copied, isSupported } = useClipboard({ copiedDuring: 1500, legacy: true })
</script>

<template>
  <BaseButton
    v-if="isSupported"
    variant="primary"
    :disabled="text === ''"
    @click="copy(props.text)"
  >
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      class="size-4"
    >
      <path v-if="copied" d="M4 10.5l4 4 8-9" stroke-linecap="round" stroke-linejoin="round" />
      <template v-else>
        <rect x="7" y="7" width="10" height="10" rx="2" />
        <path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      </template>
    </svg>
    <span aria-live="polite">{{ copied ? 'Copied' : 'Copy' }}</span>
  </BaseButton>
</template>
