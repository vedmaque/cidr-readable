<script setup lang="ts">
const rows = [
  { cidr: '172.16.0.0/12', readable: '172.[16-31].X.X', note: 'a range in one octet' },
  { cidr: '10.0.0.0/8', readable: '10.X.X.X', note: 'X means any value (0–255)' },
  { cidr: '192.168.4.0/22', readable: '192.168.[4-7].X', note: 'works for any prefix' },
  { cidr: '1.1.1.1/32', readable: '1.1.1.1', note: 'a single address' },
] as const
</script>

<template>
  <section aria-labelledby="format-reference" class="text-sm">
    <h2 id="format-reference" class="mb-2 font-semibold">Readable format</h2>
    <p class="mb-3 text-zinc-600 dark:text-zinc-400">
      Four octets separated by dots. Each octet is a number, an inclusive range in brackets, or
      <code class="font-mono">X</code>. Once an <code class="font-mono">X</code> appears, the
      remaining octets must be <code class="font-mono">X</code> too. Entries can be separated by new
      lines or commas; <code class="font-mono"># comments</code> and a leading
      <code class="font-mono">AllowedIPs =</code> are ignored. Only IPv4 is supported.
    </p>
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="text-xs text-zinc-500 uppercase">
          <tr>
            <th scope="col" class="py-1.5 pr-4 font-medium">CIDR</th>
            <th scope="col" class="py-1.5 pr-4 font-medium">Readable</th>
            <th scope="col" class="py-1.5 font-medium">Meaning</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
          <tr v-for="row in rows" :key="row.cidr">
            <td class="py-1.5 pr-4 font-mono whitespace-nowrap">{{ row.cidr }}</td>
            <td class="py-1.5 pr-4 font-mono whitespace-nowrap">{{ row.readable }}</td>
            <td class="py-1.5 text-zinc-600 dark:text-zinc-400">{{ row.note }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
