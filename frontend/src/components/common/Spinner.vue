<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    size?: 'xs' | 'sm' | 'md' | 'lg'
    vertical?: boolean
    inverted?: boolean
  }>(),
  { label: '', size: 'sm', vertical: false, inverted: false },
)

const iconSizeClasses = { xs: 'h-5 w-5', sm: 'h-7 w-7', md: 'h-10 w-10', lg: 'h-16 w-16' } as const
const textSizeClasses = { xs: 'text-sm', sm: 'text-base', md: 'text-lg', lg: 'text-xl' } as const
</script>

<template>
  <span
    :class="[
      'inline-flex items-center',
      inverted ? '' : 'text-[#646D89]',
      vertical ? 'flex-col justify-center gap-3' : 'gap-2',
    ]"
  >
    <svg
      :class="[
        iconSizeClasses[size],
        'shrink-0 animate-spin',
        inverted ? 'text-current' : 'text-blue-600',
      ]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <span v-if="label" :class="textSizeClasses[size]">{{ label }}</span>
  </span>
</template>
