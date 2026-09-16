<script setup lang="ts">
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <AdminSidebar />
    <main class="flex-1 overflow-y-auto p-8">
      <slot />
    </main>
  </div>
</template>
