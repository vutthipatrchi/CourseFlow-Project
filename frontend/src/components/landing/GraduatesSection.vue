<script setup lang="ts">
import { ref } from 'vue'
import quoteMarkSm from '@/assets/landing/quote-mark-sm.svg'
import quoteMarkLg from '@/assets/landing/quote-mark-lg.svg'
import crossGreen from '@/assets/landing/hero-cross.svg'
import dotSmall from '@/assets/landing/dot-small.svg'

interface Graduate {
  name: string
  quote: string
  avatarId: number
}

const graduates: Graduate[] = [
  {
    name: 'Saiful Islam',
    quote:
      "Start with something simple and small, then expand over time. If people call it a 'toy' you're definitely onto something. If you're waiting for encouragement from others, you're doing it wrong. By the time people think an idea is good, it's probably too late.",
    avatarId: 8,
  },
  {
    name: 'Mariam Chen',
    quote:
      'The bootcamp gave me a portfolio and the confidence to ship it. Three weeks after graduating I had two offers on the table.',
    avatarId: 47,
  },
  {
    name: 'Diego Alvarez',
    quote:
      "I switched careers at 34 with zero coding background. CourseFlow's pacing made it feel possible instead of overwhelming.",
    avatarId: 13,
  },
  {
    name: 'Priya Nair',
    quote:
      'What stood out was how fast questions got answered. It never felt like I was learning alone, even at 2am before a deadline.',
    avatarId: 25,
  },
  {
    name: 'Tom Whitfield',
    quote:
      "I'd tried two other platforms before this one and dropped both. The structured tracks here are the reason I actually finished.",
    avatarId: 33,
  },
]

const activeIndex = ref(1)
const trackRef = ref<HTMLElement | null>(null)

function goTo(index: number) {
  activeIndex.value = (index + graduates.length) % graduates.length
  const track = trackRef.value
  if (!track) return
  const card = track.children[activeIndex.value] as HTMLElement | undefined
  card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
}
</script>

<template>
  <section class="relative py-16">
    <!-- decorative shapes -->
    <span
      class="pointer-events-none absolute -right-10 -top-12 hidden h-26 w-26 rounded-full bg-linear-to-br from-blue-300 to-blue-600 md:block"
    ></span>
    <img
      :src="dotSmall"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute right-[6%] top-7 hidden h-[27px] w-[27px] md:block"
    />
    <img
      :src="crossGreen"
      alt=""
      aria-hidden="true"
      class="absolute left-[6.5%] top-[500px] hidden h-5 w-5 md:block"
    />

    <h2 class="text-center text-2xl font-bold text-gray-900 md:text-3xl">Our Graduates</h2>

    <div
      ref="trackRef"
      class="scrollbar-none mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-[8%] pb-4 md:px-[18%]"
    >
      <article
        v-for="(graduate, index) in graduates"
        :key="graduate.name"
        class="flex w-[85%] shrink-0 snap-center cursor-pointer flex-col gap-6 rounded-2xl bg-blue-100 p-6 transition-opacity duration-300 sm:w-[64%] sm:flex-row sm:items-center md:w-[64%]"
        :class="index === activeIndex ? 'opacity-100' : 'opacity-50'"
        @click="goTo(index)"
      >
        <img
          :src="`https://i.pravatar.cc/240?img=${graduate.avatarId}`"
          :alt="graduate.name"
          class="h-40 w-full shrink-0 rounded-xl object-cover sm:w-28"
        />
        <div>
          <img :src="quoteMarkSm" alt="" aria-hidden="true" class="h-4 w-auto" />
          <p class="mt-1 font-semibold text-blue-600">{{ graduate.name }}</p>
          <p class="mt-2 text-sm text-gray-500">{{ graduate.quote }}</p>
          <img :src="quoteMarkLg" alt="" aria-hidden="true" class="mt-2 ml-auto h-4 w-auto rotate-180" />
        </div>
      </article>
    </div>

    <div class="mt-2 flex justify-center gap-2">
      <button
        v-for="(graduate, index) in graduates"
        :key="graduate.name"
        type="button"
        :aria-label="`Show testimonial from ${graduate.name}`"
        class="h-2 w-2 rounded-full transition-colors"
        :class="index === activeIndex ? 'bg-blue-600' : 'bg-blue-200'"
        @click="goTo(index)"
      ></button>
    </div>
  </section>
</template>
