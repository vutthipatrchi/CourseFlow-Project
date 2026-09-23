<script setup lang="ts">
defineProps<{
  name: string
  inProgress: number
  completed: number
}>()
</script>

<template>
  <aside
    data-testid="my-courses-profile"
    class="self-start lg:sticky lg:top-6"
    aria-label="Course profile summary"
  >
    <div class="rounded-lg bg-white px-5 py-8 text-center shadow-[4px_4px_24px_rgba(0,0,0,0.08)]">
      <div
        class="mx-auto grid h-24 w-24 place-items-center rounded-full bg-blue-100 text-2xl font-semibold text-blue-700"
        aria-hidden="true"
      >
        {{
          name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        }}
      </div>

      <h2 class="mt-6 text-xl font-medium text-[#4A5879]">{{ name }}</h2>

      <dl class="mt-6 grid grid-cols-2 gap-4 text-left">
        <div class="rounded-lg bg-gray-100 px-4 py-5">
          <dt class="min-h-12 text-sm leading-6 text-[#647195]">Course<br />Inprogress</dt>
          <dd data-testid="in-progress-count" class="mt-3 text-2xl font-medium text-black">
            {{ inProgress }}
          </dd>
        </div>
        <div class="rounded-lg bg-gray-100 px-4 py-5">
          <dt class="min-h-12 text-sm leading-6 text-[#647195]">Course<br />Complete</dt>
          <dd data-testid="completed-count" class="mt-3 text-2xl font-medium text-black">
            {{ completed }}
          </dd>
        </div>
      </dl>
    </div>
  </aside>
</template>
