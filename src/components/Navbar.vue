<template>
  <header class="bg-white shadow-md sticky top-0 z-50">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16 gap-3">
        <div class="flex items-center gap-3 md:gap-8 min-w-0">
          <button type="button" class="md:hidden p-2 text-gray-700 hover:text-primary" @click="mobileMenuOpen = !mobileMenuOpen" :aria-label="labels.menu">
            <i class="fas fa-bars text-xl"></i>
          </button>
          <router-link to="/" class="text-2xl font-bold text-primary shrink-0">BrandStore</router-link>
          <nav class="hidden md:flex space-x-8">
            <router-link to="/" class="nav-link text-gray-700 hover:text-primary transition-colors duration-200">{{ labels.home }}</router-link>
            <router-link to="/products" class="nav-link text-gray-700 hover:text-primary transition-colors duration-200">{{ labels.products }}</router-link>
            <router-link to="/orders" class="nav-link text-gray-700 hover:text-primary transition-colors duration-200">{{ labels.orders }}</router-link>
          </nav>
        </div>
        <div class="flex items-center space-x-2 md:space-x-4">
          <form class="relative hidden lg:block" @submit.prevent="handleGlobalSearch">
            <input v-model.trim="globalSearch" type="text" :placeholder="labels.searchPlaceholder" class="search-input w-64 px-4 py-2 border border-gray-300 rounded-lg text-sm pr-10">
            <button type="submit" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-200" :aria-label="labels.search">
              <i class="fas fa-search"></i>
            </button>
          </form>
          <select v-model="currentLocale" @change="changeLanguage" class="border border-gray-300 rounded-lg px-3 py-1 text-sm bg-white">
            <option value="en">EN</option>
            <option value="zh-CN">中文</option>
          </select>
          <div class="relative group hidden md:block">
            <button type="button" class="p-2 text-gray-700 hover:text-primary transition-colors duration-200">
              <i class="fas fa-user text-xl"></i>
            </button>
            <div class="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div class="py-2">
                <router-link v-if="isLoggedIn" to="/account" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary"><i class="fas fa-user-circle mr-3"></i>{{ labels.account }}</router-link>
                <router-link v-if="isLoggedIn" to="/orders" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary"><i class="fas fa-shopping-bag mr-3"></i>{{ labels.orders }}</router-link>
                <router-link v-if="!isLoggedIn" to="/login" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary"><i class="fas fa-sign-in-alt mr-3"></i>{{ labels.signIn }}</router-link>
                <router-link v-if="!isLoggedIn" to="/register" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary"><i class="fas fa-user-plus mr-3"></i>{{ labels.register }}</router-link>
                <div v-if="isLoggedIn" class="border-t border-gray-200 my-1"></div>
                <button v-if="isLoggedIn" @click="handleLogout" class="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-red-500"><i class="fas fa-sign-out-alt mr-3"></i>{{ labels.logout }}</button>
              </div>
            </div>
          </div>
          <router-link to="/cart" class="p-2 text-gray-700 hover:text-primary transition-colors duration-200 relative">
            <i class="fas fa-shopping-cart text-xl"></i>
            <span v-if="cartCount > 0" class="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{{ cartCount }}</span>
          </router-link>
        </div>
      </div>
      <div v-if="mobileMenuOpen" class="md:hidden pb-4 border-t border-gray-100">
        <form class="relative mt-4" @submit.prevent="handleGlobalSearchAndClose">
          <input v-model.trim="globalSearch" type="text" :placeholder="labels.searchPlaceholder" class="search-input w-full px-4 py-2 border border-gray-300 rounded-lg text-sm pr-10">
          <button type="submit" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-200" :aria-label="labels.search"><i class="fas fa-search"></i></button>
        </form>
        <nav class="mt-4 space-y-1">
          <router-link to="/" class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50" @click="closeMobileMenu">{{ labels.home }}</router-link>
          <router-link to="/products" class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50" @click="closeMobileMenu">{{ labels.products }}</router-link>
          <router-link to="/orders" class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50" @click="closeMobileMenu">{{ labels.orders }}</router-link>
          <router-link v-if="isLoggedIn" to="/account" class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50" @click="closeMobileMenu">{{ labels.account }}</router-link>
          <router-link v-if="!isLoggedIn" to="/login" class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50" @click="closeMobileMenu">{{ labels.signIn }}</router-link>
          <router-link v-if="!isLoggedIn" to="/register" class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50" @click="closeMobileMenu">{{ labels.register }}</router-link>
          <button v-if="isLoggedIn" type="button" class="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50" @click="handleLogout">{{ labels.logout }}</button>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
const mobileMenuOpen = ref(false)

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))
const labels = computed(() => isZh.value ? {
  menu: '菜单', home: '首页', products: '商品', orders: '我的订单', account: '我的账户',
  signIn: '登录', register: '注册', logout: '退出登录', search: '搜索商品',
  searchPlaceholder: '搜索商品...', language: '语言'
} : {
  menu: 'Menu', home: 'Home', products: 'Products', orders: 'My Orders', account: 'My Account',
  signIn: 'Sign In', register: 'Register', logout: 'Logout', search: 'Search products',
  searchPlaceholder: 'Search products...', language: 'Language'
})
const cartCount = computed(() => cartStore.itemCount)

watch(() => route.query.search, value => { globalSearch.value = String(value || '') }, { immediate: true })
watch(() => route.fullPath, () => { mobileMenuOpen.value = false; syncSession() })

const changeLanguage = () => {
  locale.value = currentLocale.value
  localStorage.setItem('locale', currentLocale.value)
  document.documentElement.lang = currentLocale.value
}
const handleGlobalSearch = () => {
  const keyword = globalSearch.value.trim()
  router.push({ path: '/products', query: keyword ? { search: keyword } : {} })
}
const handleGlobalSearchAndClose = () => { handleGlobalSearch(); closeMobileMenu() }
const closeMobileMenu = () => { mobileMenuOpen.value = false }
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
  if (!confirm(isZh.value ? '确定要退出登录吗？' : 'Are you sure you want to logout?')) return
  await authAPI.logout()
  isLoggedIn.value = false
  window.dispatchEvent(new Event('auth-changed'))
  closeMobileMenu()
  router.push('/')
}
const handleAuthChanged = () => syncSession()

onMounted(() => {
  currentLocale.value = locale.value
  document.documentElement.lang = locale.value
  syncSession()
  window.addEventListener('auth-changed', handleAuthChanged)
})
onBeforeUnmount(() => window.removeEventListener('auth-changed', handleAuthChanged))
</script>
