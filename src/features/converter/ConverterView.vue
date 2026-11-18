<script setup lang="ts">
import { computed } from 'vue'
import { pluralize } from '@/utils/pluralize'
import InputPanel from './components/InputPanel.vue'
import IssueList from './components/IssueList.vue'
import OutputPanel from './components/OutputPanel.vue'
import type { ConverterMode } from './modes'
import { useConverter, type ConverterStatus } from './useConverter'

const props = defineProps<{ mode: ConverterMode }>()

// The route view is keyed by mode, so `mode` never changes during this component's lifetime.
const { input, listStyle, supportsListStyle, result, errorCount, status, outputText } =
  useConverter(props.mode)

const outputNoun = computed(() =>
  props.mode.output === 'cidr' ? ['network', 'networks'] : ['pattern', 'patterns'],
)

// Counts only describe a result that is actually shown (or legitimately empty).
const summary = computed(() => {
  if (status.value !== 'ready' && status.value !== 'empty-result') return ''
  const { inputEntryCount, entries } = result.value
  const [singular, plural] = outputNoun.value as [string, string]
  const parts = [
    `${pluralize(inputEntryCount, 'entry', 'entries')} → ${pluralize(entries.length, singular, plural)}`,
  ]
  if (errorCount.value > 0) parts.push(`${pluralize(errorCount.value, 'entry', 'entries')} skipped`)
  return parts.join(' · ')
})

const emptyMessages: Record<Exclude<ConverterStatus, 'ready'>, string> = {
  idle: 'The result will appear here as you type.',
  'no-entries': 'The input has no entries yet, only comments or blank lines.',
  'only-errors': 'Nothing to convert: fix the problems listed under the input.',
  'has-errors':
    'Fix the problems listed under the input first: invalid entries would be left out of the result.',
  'empty-result': props.mode.emptyResultMessage ?? 'The result is empty.',
}

const emptyMessage = computed(() => (status.value === 'ready' ? '' : emptyMessages[status.value]))
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-zinc-600 dark:text-zinc-400">{{ mode.description }}</p>
    <div class="grid gap-4 lg:grid-cols-2">
      <InputPanel
        v-model="input"
        :label="mode.inputLabel"
        :placeholder="mode.inputPlaceholder"
        :example="mode.example"
      >
        <IssueList :issues="result.issues" />
      </InputPanel>
      <OutputPanel
        v-model:list-style="listStyle"
        :label="mode.outputLabel"
        :text="outputText"
        :summary="summary"
        :show-list-style="supportsListStyle"
        :empty-message="emptyMessage"
      />
    </div>
  </div>
</template>
