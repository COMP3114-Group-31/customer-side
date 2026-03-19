<template>
  <header class="bg-white shadow-md sticky top-0 z-50">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center space-x-10">
          <router-link to="/" class="text-2xl font-bold text-primary">
            BrandStore
          </router-link>

          <nav class="hidden md:flex space-x-8">
            <router-link to="/" class="nav-link text-gray-700 hover:text-primary transition-colors duration-200">
              Home
            </router-link>
            <router-link to="/products" class="nav-link text-gray-700 hover:text-primary transition-colors duration-200">
              Products
            </router-link>
            <router-link to="/orders" class="nav-link text-gray-700 hover:text-primary transition-colors duration-200">
              My Orders
            </router-link>
          </nav>
        </div>

        <div class="flex items-center space-x-4">
          <form class="relative hidden md:block" @submit.prevent="handleGlobalSearch">
            <input
              v-model.trim="globalSearch"
              type="text"
              placeholder="Search products..."
              class="search-input w-64 px-4 py-2 border border-gray-300 rounded-lg text-sm pr-10"
            >
            <button
              type="submit"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-200"
              aria-label="Search products"
            >
              <i class="fas fa-search"></i>
            </button>
          </form>

          <select
            v-model="currentLocale"
            @change="changeLanguage"
            class="border border-gray-300 rounded-lg px-3 py-1 text-sm"
          >
            <option value="en">EN</option>
            <option value="zh-CN">中文</option>
          </select>

          <div class="relative group">
            <button class="p-2 text-gray-700 hover:text-primary transition-colors duration-200">
              <i class="fas fa-user text-xl"></i>
            </button>
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div class="py-2">
                <router-link
                  v-if="isLoggedIn"
                  to="/account"
                  class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary"
                >
                  <i class="fas fa-user-circle mr-3"></i>My Account
                </router-link>
                <router-link
                  v-if="isLoggedIn"
                  to="/orders"
                  class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary"
                >
                  <i class="fas fa-shopping-bag mr-3"></i>My Orders
                </router-link>
                <router-link
                  v-if="!isLoggedIn"
                  to="/login"
                  class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary"
                >
                  <i class="fas fa-sign-in-alt mr-3"></i>Sign In
                </router-link>
                <router-link
                  v-if="!isLoggedIn"
                  to="/register"
                  class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary"
                >
                  <i class="fas fa-user-plus mr-3"></i>Register
                </router-link>
                <div v-if="isLoggedIn" class="border-t border-gray-200 my-1"></div>
                <button
                  v-if="isLoggedIn"
                  @click="handleLogout"
                  class="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-red-500"
                >
                  <i class="fas fa-sign-out-alt mr-3"></i>Logout
                </button>
              </div>
            </div>
          </div>

          <router-link to="/cart" class="p-2 text-gray-700 hover:text-primary transition-colors duration-200 relative">
            <i class="fas fa-shopping-cart text-xl"></i>
            <span
              v-if="cartCount > 0"
              class="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
            >
              {{ cartCount }}
            </span>
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { authAPI } from '../api'
import { useCartStore } from '../stores/cart'

const { locale } = useI18n()
const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()

const currentLocale = ref(locale.value)
const globalSearch = ref('')
const isLoggedIn = ref(authAPI.isLocallyLoggedIn())

const cartCount = computed(() => cartStore.itemCount)

watch(
  () => route.query.search,
  (value) => {
    globalSearch.value = String(value || '')
  },
  { immediate: true }
)

watch(
  () => route.fullPath,
  () => {
    syncSession()
  }
)

const changeLanguage = () => {
  locale.value = currentLocale.value
  localStorage.setItem('locale', currentLocale.value)
  document.documentElement.lang = currentLocale.value
}

const handleGlobalSearch = () => {
  const keyword = globalSearch.value.trim()

  router.push({
    path: '/products',
    query: keyword ? { search: keyword } : {}
  })
}

const syncSession = async () => {
  isLoggedIn.value = authAPI.isLocallyLoggedIn()

  try {
    const session = await authAPI.getSession()
    isLoggedIn.value = !!session?.profile
  } catch {
    isLoggedIn.value = authAPI.isLocallyLoggedIn()
  }
}

const handleLogout = async () => {
  if (!confirm('Are you sure you want to logout?')) return

  await authAPI.logout()
  isLoggedIn.value = false
  router.push('/')
}

onMounted(() => {
  currentLocale.value = locale.value
  syncSession()
})
</script>
