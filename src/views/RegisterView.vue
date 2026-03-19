<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-lg bg-white shadow-lg rounded-2xl p-8">
      <h1 class="text-3xl font-bold text-center text-gray-900 mb-2">Create account</h1>
      <p class="text-center text-sm text-gray-600 mb-8" v-if="!isLoggedIn">
        Already have an account?
        <router-link to="/login" class="text-primary hover:text-orange-500 font-medium">
          Sign in
        </router-link>
      </p>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="mb-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
        {{ successMessage }}
      </div>

      <form class="space-y-5" @submit.prevent="handleRegister">
        <div>
          <label for="fullName" class="block text-sm font-medium text-gray-700 mb-2">Full name</label>
          <input
            id="fullName"
            v-model.trim="form.fullName"
            type="text"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary"
            :class="validationErrors.fullName ? 'border-red-300' : 'border-gray-300'"
          >
          <p v-if="validationErrors.fullName" class="mt-1 text-sm text-red-600">{{ validationErrors.fullName }}</p>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary"
            :class="validationErrors.email ? 'border-red-300' : 'border-gray-300'"
          >
          <p v-if="validationErrors.email" class="mt-1 text-sm text-red-600">{{ validationErrors.email }}</p>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary"
            :class="validationErrors.password ? 'border-red-300' : 'border-gray-300'"
          >
          <p v-if="validationErrors.password" class="mt-1 text-sm text-red-600">{{ validationErrors.password }}</p>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary"
            :class="validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'"
          >
          <p v-if="validationErrors.confirmPassword" class="mt-1 text-sm text-red-600">{{ validationErrors.confirmPassword }}</p>
        </div>

        <div>
          <label for="shippingAddress" class="block text-sm font-medium text-gray-700 mb-2">Shipping address</label>
          <textarea
            id="shippingAddress"
            v-model.trim="form.shippingAddress"
            rows="3"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary"
            :class="validationErrors.shippingAddress ? 'border-red-300' : 'border-gray-300'"
          ></textarea>
          <p v-if="validationErrors.shippingAddress" class="mt-1 text-sm text-red-600">{{ validationErrors.shippingAddress }}</p>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-primary hover:bg-orange-600 text-white py-3 rounded-lg font-medium disabled:opacity-60"
        >
          <span v-if="isLoading"><i class="fas fa-spinner fa-spin mr-2"></i>Creating account...</span>
          <span v-else>Create account</span>
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
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  shippingAddress: ''
})

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const validationErrors = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  shippingAddress: ''
})

const clearValidationErrors = () => {
  Object.keys(validationErrors).forEach((key) => {
    validationErrors[key] = ''
  })
}

const validateForm = () => {
  clearValidationErrors()

  if (!form.fullName) validationErrors.fullName = 'Full name is required.'
  if (!form.email) {
    validationErrors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    validationErrors.email = 'Please enter a valid email address.'
  }

  if (!form.password) {
    validationErrors.password = 'Password is required.'
  } else if (form.password.length < 6) {
    validationErrors.password = 'Password must be at least 6 characters.'
  }

  if (!form.confirmPassword) {
    validationErrors.confirmPassword = 'Please confirm your password.'
  } else if (form.password !== form.confirmPassword) {
    validationErrors.confirmPassword = 'Passwords do not match.'
  }

  if (!form.shippingAddress) validationErrors.shippingAddress = 'Shipping address is required.'

  return Object.values(validationErrors).every((value) => !value)
}

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!validateForm()) return

  try {
    isLoading.value = true
    const result = await authAPI.register({
      full_name: form.fullName,
      email: form.email,
      password: form.password,
      shipping_address: form.shippingAddress
    })

    successMessage.value = result?.message || 'Registration successful. Redirecting to login...'

    setTimeout(() => {
      router.push('/login')
    }, 1200)
  } catch (error) {
    console.error('Registration failed:', error)
    errorMessage.value = error.message || 'Registration failed. Please try again.'
  } finally {
    isLoading.value = false
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
