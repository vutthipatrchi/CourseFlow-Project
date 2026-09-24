<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getToken, useUser, useClerk } from '@clerk/vue'
import { getRoleFromToken } from '@/lib/jwt'
import iconPerson from '@/assets/landing/icon-person.svg'
import iconBook from '@/assets/landing/icon-book.svg'
import iconChecklist from '@/assets/landing/icon-checklist.svg'
import iconStar from '@/assets/landing/icon-star.svg'
import iconLogout from '@/assets/landing/icon-logout.svg'

interface MenuItem {
  label: string
  icon: string
  href: string
}

const isAdmin = ref(false)

const menuItems = computed<MenuItem[]>(() => [
  { label: 'Profile', icon: iconPerson, href: '/profile' },
  {
    label: 'My Courses',
    icon: iconBook,
    href: isAdmin.value ? '/admin/courses' : '/my-courses',
  },
  { label: 'My Assignments', icon: iconChecklist, href: '/my-assignments' },
  { label: 'My Wishlist', icon: iconStar, href: '/wishlist' },
])

const router = useRouter()
const clerk = useClerk()
const { user } = useUser()

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)

function toggle() {
  isOpen.value = !isOpen.value
}

function handleClickOutside(event: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

async function handleLogout() {
  isOpen.value = false
  await clerk.value?.signOut()
  router.push('/')
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  isAdmin.value = getRoleFromToken(await getToken()) === 'admin'
})
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
<template>
  <div ref="rootRef" class="relative">
    <button type="button" class="flex cursor-pointer items-center gap-2" @click="toggle">
      <img
        :src="user?.imageUrl"
        :alt="user?.fullName ?? 'User'"
        class="h-9 w-9 rounded-full object-cover"
      />
      <span class="hidden text-sm font-medium text-darkblue-500 sm:inline">
        {{ user?.fullName }}
      </span>
      <svg
        viewBox="0 0 24 24"
        class="h-4 w-4 text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
      >
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      leave-active-class="transition-all duration-100 ease-in"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-52 origin-top-right rounded-xl border border-gray-100 bg-white py-2 shadow-lg"
      >
        <template v-for="item in menuItems" :key="item.label">
          <RouterLink
            v-if="item.href.startsWith('/')"
            :to="item.href"
            class="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50"
            @click="isOpen = false"
          >
            <img :src="item.icon" alt="" aria-hidden="true" class="h-4 w-4" />
            {{ item.label }}
          </RouterLink>

          <a
            v-else
            :href="item.href"
            class="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50"
            @click="isOpen = false"
          >
            <img :src="item.icon" alt="" aria-hidden="true" class="h-4 w-4" />
            {{ item.label }}
          </a>
        </template>

        <hr class="my-2 border-gray-100" />
        <button
          type="button"
          class="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50"
          @click="handleLogout"
        >
          <img :src="iconLogout" alt="" aria-hidden="true" class="h-4 w-4" />
          Log out
        </button>
      </div>
    </Transition>
  </div>
</template>
