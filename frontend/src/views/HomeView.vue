<script setup lang="ts">
import AppNavbar from '@/components/landing/AppNavbar.vue'
import HeroSection from '@/components/landing/HeroSection.vue'
import FeatureHighlights from '@/components/landing/FeatureHighlights.vue'
import InstructorsSection from '@/components/landing/InstructorsSection.vue'
import GraduatesSection from '@/components/landing/GraduatesSection.vue'
import CtaBanner from '@/components/landing/CtaBanner.vue'
import AppFooter from '@/components/landing/AppFooter.vue'
</script>

<template>
  <div>
    <AppNavbar />
    <main>
      <HeroSection />
      <FeatureHighlights />
      <InstructorsSection />
      <GraduatesSection />
      <CtaBanner />
    </main>
    <AppFooter />
  </div>
</template>
