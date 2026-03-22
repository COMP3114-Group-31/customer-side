<template>
  <div :style="{ zoom: zoom }" class="min-h-screen bg-gray-50">
    <Navbar />
    <router-view />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Navbar from './components/Navbar.vue'

const allowedZooms = ['95%', '100%', '105%']
const savedZoom = localStorage.getItem('global_zoom')
const zoom = ref(allowedZooms.includes(savedZoom) ? savedZoom : '100%')

const syncZoom = () => {
  const nextZoom = localStorage.getItem('global_zoom')
  zoom.value = allowedZooms.includes(nextZoom) ? nextZoom : '100%'
}

const handleGlobalZoomChanged = () => {
  syncZoom()
}

const handleStorage = (event) => {
  if (event.key === 'global_zoom') {
    syncZoom()
  }
}

onMounted(() => {
  syncZoom()
  window.addEventListener('global-zoom-changed', handleGlobalZoomChanged)
  window.addEventListener('storage', handleStorage)
})

onBeforeUnmount(() => {
  window.removeEventListener('global-zoom-changed', handleGlobalZoomChanged)
  window.removeEventListener('storage', handleStorage)
})
</script>
