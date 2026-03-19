<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />
    <router-view />
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Navbar from './components/Navbar.vue'

const { locale } = useI18n()

watch(
  locale,
  (value) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('locale', value)
      localStorage.setItem('language', value)
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = value
    }
  },
  { immediate: true }
)
</script>
