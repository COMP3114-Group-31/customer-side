<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
      <h1 class="text-3xl font-bold text-center text-gray-900 mb-2">Sign in</h1>
      <p class="text-center text-sm text-gray-600 mb-8" v-if="!isLoggedIn">
        No account yet?
        <router-link to="/register" class="text-primary hover:text-orange-500 font-medium">
          Create one
        </router-link>
      </p>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
        {{ errorMessage }}
      </div>

      <form class="space-y-5" @submit.prevent="handleLogin">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary"
            :class="errors.email ? 'border-red-300' : 'border-gray-300'"
          >
          <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary"
            :class="errors.password ? 'border-red-300' : 'border-gray-300'"
          >
          <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-primary hover:bg-orange-600 text-white py-3 rounded-lg font-medium disabled:opacity-60"
        >
          <span v-if="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Signing in...</span>
          <span v-else>Sign in</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../api'

const router = useRouter()
const isLoggedIn = ref(authAPI.isLocallyLoggedIn())

const form = reactive({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: ''
})

const errorMessage = ref('')
const loading = ref(false)

const validateForm = () => {
  errors.email = ''
  errors.password = ''

  if (!form.email) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!form.password) {
    errors.password = 'Password is required.'
  }

  return !errors.email && !errors.password
}

const handleLogin = async () => {
  errorMessage.value = ''

  if (!validateForm()) return

  try {
    loading.value = true
    const result = await authAPI.login({
      email: form.email,
      password: form.password
    })

    if (result?.profile) {
      isLoggedIn.value = true
      router.replace('/account')
      return
    }

    errorMessage.value = 'Login failed. Please try again.'
  } catch (error) {
    console.error('Login failed:', error)
    errorMessage.value = error.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const session = await authAPI.getSession()
    isLoggedIn.value = !!session?.profile
    if (session?.profile) {
      router.replace('/account')
    }
  } catch (error) {
    console.error('Session check failed:', error)
    isLoggedIn.value = authAPI.isLocallyLoggedIn()
  }
})
</script>
