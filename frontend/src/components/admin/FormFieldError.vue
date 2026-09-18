<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string
    tone?: 'error' | 'warning'
  }>(),
  { tone: 'error' },
)
</script>

<template>
  <span v-if="message" :class="['field-error', `field-error--${tone}`]" role="alert">
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M14.3996 7.99961C14.3996 11.5342 11.5342 14.3996 7.99961 14.3996C4.46499 14.3996 1.59961 11.5342 1.59961 7.99961C1.59961 4.46499 4.46499 1.59961 7.99961 1.59961C11.5342 1.59961 14.3996 4.46499 14.3996 7.99961ZM8.79961 11.1996C8.79961 11.6414 8.44144 11.9996 7.99961 11.9996C7.55778 11.9996 7.19961 11.6414 7.19961 11.1996C7.19961 10.7578 7.55778 10.3996 7.99961 10.3996C8.44144 10.3996 8.79961 10.7578 8.79961 11.1996ZM7.99961 3.99961C7.55778 3.99961 7.19961 4.35778 7.19961 4.79961V7.99961C7.19961 8.44144 7.55778 8.79961 7.99961 8.79961C8.44144 8.79961 8.79961 8.44144 8.79961 7.99961V4.79961C8.79961 4.35778 8.44144 3.99961 7.99961 3.99961Z"
        fill="currentColor"
      />
    </svg>
    {{ message }}
  </span>
</template>

<style scoped>
.field-error {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  color: #9b2fac;
  font-size: 12px;
  line-height: 18px;
}

.field-error--warning {
  color: #f47e20;
}

.field-error svg {
  width: 16px;
  height: 16px;
  flex: none;
}
</style>
