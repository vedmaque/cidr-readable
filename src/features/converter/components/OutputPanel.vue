<script setup lang="ts">
import type { ListStyle } from '@/domain/ip'
import CopyButton from '@/components/ui/CopyButton.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import PanelCard from './PanelCard.vue'

defineProps<{
  label: string
  text: string
  summary: string
  showListStyle: boolean
  emptyMessage: string
}>()
const listStyle = defineModel<ListStyle>('listStyle', { required: true })

const titleId = 'converter-output-title'
const styleOptions = [
  { value: 'lines', label: 'Lines' },
  { value: 'wireguard', label: 'WireGuard' },
] as const
</script>

<template>
  <PanelCard :title-id="titleId">
    <template #header>
      <h2 :id="titleId" class="text-sm font-semibold">{{ label }}</h2>
      <div class="flex items-center gap-2">
        <SegmentedControl
          v-if="showListStyle"
          v-model="listStyle"
          label="Output style"
          :options="styleOptions"
        />
        <CopyButton :text="text" />
      </div>
    </template>
    <pre
      v-if="text !== ''"
      data-testid="output"
      tabindex="0"
      :aria-labelledby="titleId"
      class="min-h-0 flex-1 overflow-auto p-3 font-mono text-sm leading-6 break-words whitespace-pre-wrap focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600"
      >{{ text }}</pre>
    <p
      v-else
      data-testid="output-empty"
      class="flex min-h-0 flex-1 items-center justify-center p-6 text-center text-sm text-zinc-500"
    >
      {{ emptyMessage }}
    </p>
    <footer
      v-if="summary !== ''"
      data-testid="output-summary"
      class="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800"
    >
      {{ summary }}
    </footer>
  </PanelCard>
</template>
