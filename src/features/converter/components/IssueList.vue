<script setup lang="ts">
import type { Issue } from '@/domain/ip'

defineProps<{ issues: readonly Issue[] }>()
</script>

<template>
  <ul
    v-if="issues.length > 0"
    aria-label="Problems in the input"
    data-testid="issues"
    class="max-h-40 shrink-0 space-y-1 overflow-y-auto border-t border-zinc-200 p-3 text-sm dark:border-zinc-800"
  >
    <li
      v-for="(issue, index) in issues"
      :key="index"
      class="flex gap-2"
      :class="
        issue.severity === 'error'
          ? 'text-red-700 dark:text-red-400'
          : 'text-amber-700 dark:text-amber-400'
      "
    >
      <span class="shrink-0 font-medium">
        {{ issue.severity === 'error' ? 'Error' : 'Warning' }}
      </span>
      <span class="min-w-0 text-zinc-700 dark:text-zinc-300">
        <span class="text-zinc-500">Line {{ issue.line }}</span>
        ·
        <code class="font-mono break-all">{{ issue.entry }}</code>
        — {{ issue.message }}
      </span>
    </li>
  </ul>
</template>
