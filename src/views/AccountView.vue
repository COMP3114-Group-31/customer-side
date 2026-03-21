<template>
  <div :style="{ zoom: zoom }">
    <div class="container mx-auto px-4 py-8">
      <div class="py-4">
        <nav class="flex text-sm text-gray-600">
          <router-link to="/" class="hover:text-primary">{{ labels.home }}</router-link>
          <span class="mx-2">/</span>
          <span class="text-gray-900">{{ labels.account }}</span>
        </nav>
      </div>

      <div v-if="loading" class="text-center py-12">
        <i class="fas fa-spinner fa-spin text-2xl text-primary"></i>
        <p class="mt-2 text-gray-600">{{ labels.loading }}</p>
      </div>

      <div v-else-if="!userProfile" class="text-center py-12 bg-white rounded-xl shadow-lg">
        <p class="text-gray-600 mb-4">{{ labels.loginToView }}</p>
        <router-link to="/login" class="inline-block bg-primary text-white px-6 py-3 rounded-button hover:bg-orange-600">
          {{ labels.loginNow }}
        </router-link>
      </div>

      <div v-else class="flex flex-col lg:flex-row gap-8">
        <div class="lg:w-1/4">
          <div class="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <div class="flex items-center mb-6">
              <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                <i class="fas fa-user text-2xl text-gray-500"></i>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">{{ userProfile.full_name }}</h3>
                <p class="text-sm text-gray-600 break-all">{{ userProfile.email }}</p>
              </div>
            </div>

            <div class="mb-6 border border-gray-200 rounded-xl p-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold text-gray-900">{{ labels.fontSize }}</h3>
                <span class="text-primary font-semibold">{{ fontSizeLabel }}</span>
              </div>
              <p class="text-sm text-gray-500 mb-4">{{ labels.fontSizeHint }}</p>
              <input
                v-model="zoom"
                type="range"
                min="90%"
                max="120%"
                step="5%"
                class="w-full accent-primary"
              >
              <div class="grid grid-cols-3 gap-2 mt-4">
                <button type="button" class="px-3 py-2 rounded-lg border" @click="setZoom('90%')">{{ labels.small }}</button>
                <button type="button" class="px-3 py-2 rounded-lg border" @click="setZoom('100%')">{{ labels.medium }}</button>
                <button type="button" class="px-3 py-2 rounded-lg border" @click="setZoom('110%')">{{ labels.large }}</button>
              </div>
            </div>

            <nav class="space-y-2">
              <div class="flex items-center p-3 text-primary bg-primary/10 rounded-lg">
                <i class="fas fa-user-circle mr-3"></i>
                {{ labels.profileOverview }}
              </div>
              <router-link to="/orders" class="flex items-center p-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg">
                <i class="fas fa-shopping-bag mr-3"></i>
                {{ labels.myOrders }}
              </router-link>
              <router-link to="/cart" class="flex items-center p-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg">
                <i class="fas fa-shopping-cart mr-3"></i>
                {{ labels.myCart }}
              </router-link>
              <button
                @click="handleLogout"
                class="w-full flex items-center p-3 text-gray-700 hover:text-red-500 hover:bg-gray-50 rounded-lg"
              >
                <i class="fas fa-sign-out-alt mr-3"></i>
                {{ labels.logout }}
              </button>
            </nav>
          </div>
        </div>

        <div class="lg:w-3/4 space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white rounded-xl shadow-lg p-6">
              <div class="text-sm text-gray-500 mb-2">{{ labels.accountName }}</div>
              <div class="text-lg font-semibold text-gray-900">{{ userProfile.full_name || labels.customer }}</div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-6">
              <div class="text-sm text-gray-500 mb-2">{{ labels.recentOrders }}</div>
              <div class="text-lg font-semibold text-gray-900">{{ recentOrders.length }}</div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-6">
              <div class="text-sm text-gray-500 mb-2">{{ labels.loginStatus }}</div>
              <div class="text-lg font-semibold text-green-600">{{ labels.signedIn }}</div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">{{ labels.profileInformation }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div class="text-sm text-gray-500 mb-1">{{ labels.fullName }}</div>
                <div class="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">{{ userProfile.full_name || labels.notProvided }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500 mb-1">{{ labels.email }}</div>
                <div class="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 break-all">{{ userProfile.email || labels.notProvided }}</div>
              </div>
              <div class="md:col-span-2">
                <div class="text-sm text-gray-500 mb-1">{{ labels.shippingAddress }}</div>
                <div class="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 whitespace-pre-line">
                  {{ userProfile.shipping_address || labels.noShippingAddress }}
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-bold text-gray-900">{{ labels.recentOrders }}</h2>
              <router-link to="/orders" class="text-primary hover:underline">
                {{ labels.viewAllOrders }}
              </router-link>
            </div>

            <div v-if="recentOrdersLoading" class="text-center py-4">
              <i class="fas fa-spinner fa-spin text-primary"></i>
            </div>

            <div v-else-if="ordersUnavailable" class="text-center py-8 text-gray-500">
              {{ labels.ordersUnavailable }}
            </div>

            <div v-else-if="recentOrders.length === 0" class="text-center py-8 text-gray-500">
              {{ labels.noOrdersYet }}
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-3 font-medium text-gray-700">{{ labels.orderNumber }}</th>
                    <th class="text-left py-3 font-medium text-gray-700">{{ labels.date }}</th>
                    <th class="text-left py-3 font-medium text-gray-700">{{ labels.total }}</th>
                    <th class="text-left py-3 font-medium text-gray-700">{{ labels.status }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="order in recentOrders" :key="order.order_id" class="border-b border-gray-200">
                    <td class="py-4">#{{ order.order_id }}</td>
                    <td class="py-4">{{ formatDate(order.purchase_date) }}</td>
                    <td class="py-4">{{ formatPrice(order.total_amount) }}</td>
                    <td class="py-4">
                      <span :class="getStatusClass(order.status)" class="px-3 py-1 rounded-full text-sm">
                        {{ getStatusText(order.status) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { authAPI, ordersAPI } from '../api'

const router = useRouter()
const { locale } = useI18n()

const loading = ref(true)
const recentOrdersLoading = ref(false)
const userProfile = ref(null)
const recentOrders = ref([])
const ordersUnavailable = ref(false)
const zoom = ref(localStorage.getItem('account_zoom') || '100%')

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))
const labels = computed(() => isZh.value ? {
  home: '首页',
  account: '我的账户',
  loading: '正在加载...',
  loginToView: '请先登录后查看账户信息',
  loginNow: '立即登录',
  fontSize: '显示设置',
  fontSizeHint: '调节页面字体大小',
  small: '小',
  medium: '中',
  large: '大',
  profileOverview: '账户概览',
  myOrders: '我的订单',
  myCart: '我的购物车',
  logout: '退出登录',
  accountName: '账户名称',
  customer: '客户',
  recentOrders: '最近订单',
  loginStatus: '登录状态',
  signedIn: '已登录',
  profileInformation: '个人资料',
  fullName: '姓名',
  email: '邮箱',
  shippingAddress: '收货地址',
  notProvided: '未提供',
  noShippingAddress: '暂无收货地址',
  viewAllOrders: '查看全部订单',
  ordersUnavailable: '订单暂时不可用',
  noOrdersYet: '暂时还没有订单',
  orderNumber: '订单号',
  date: '日期',
  total: '总计',
  status: '状态',
  logoutConfirm: '确定要退出登录吗？'
} : {
  home: 'Home',
  account: 'My Account',
  loading: 'Loading...',
  loginToView: 'Please login to view your account',
  loginNow: 'Login Now',
  fontSize: 'Display Settings',
  fontSizeHint: 'Adjust page font size',
  small: 'S',
  medium: 'M',
  large: 'L',
  profileOverview: 'Profile Overview',
  myOrders: 'My Orders',
  myCart: 'My Cart',
  logout: 'Logout',
  accountName: 'Account Name',
  customer: 'Customer',
  recentOrders: 'Recent Orders',
  loginStatus: 'Login Status',
  signedIn: 'Signed in',
  profileInformation: 'Profile Information',
  fullName: 'Full Name',
  email: 'Email',
  shippingAddress: 'Shipping Address',
  notProvided: 'Not provided',
  noShippingAddress: 'No shipping address',
  viewAllOrders: 'View all orders',
  ordersUnavailable: 'Orders are temporarily unavailable.',
  noOrdersYet: 'No orders yet',
  orderNumber: 'Order #',
  date: 'Date',
  total: 'Total',
  status: 'Status',
  logoutConfirm: 'Are you sure you want to logout?'
})

const fontSizeLabel = computed(() => {
  if (zoom.value === '90%') return labels.value.small
  if (zoom.value === '110%') return labels.value.large
  return labels.value.medium
})

watch(zoom, (value) => {
  localStorage.setItem('account_zoom', value)
})

const setZoom = (value) => {
  zoom.value = value
}

const getStatusClass = (status) => {
  const classes = {
    created: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    hold: 'bg-orange-100 text-orange-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
  const key = String(status || '').toLowerCase()
  const zhMap = { created: '已创建', processing: '处理中', shipped: '已发货', delivered: '已送达', completed: '已完成', cancelled: '已取消', hold: '挂起' }
  const enMap = { created: 'Created', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', completed: 'Completed', cancelled: 'Cancelled', hold: 'On Hold' }
  return (isZh.value ? zhMap[key] : enMap[key]) || status
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString(isZh.value ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: isZh.value ? 'long' : 'short',
    day: 'numeric'
  })
}

const formatPrice = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(value || 0))
}

const handleLogout = async () => {
  if (!confirm(labels.value.logoutConfirm)) return

  try {
    await authAPI.logout()
  } finally {
    userProfile.value = null
    recentOrders.value = []
    router.push('/login')
  }
}

const fetchUserData = async () => {
  try {
    const session = await authAPI.getSession()

    if (!session?.profile) {
      userProfile.value = null
      recentOrders.value = []
      return
    }

    userProfile.value = session.profile
    ordersUnavailable.value = false

    try {
      recentOrdersLoading.value = true
      const ordersData = await ordersAPI.getOrders()
      recentOrders.value = (ordersData?.orders || []).slice(0, 5)
    } catch (orderError) {
      console.error('Failed to fetch orders:', orderError)
      recentOrders.value = []
      ordersUnavailable.value = orderError.status === 404
    }
  } catch (error) {
    console.error('Failed to fetch user data:', error)
    userProfile.value = null
    recentOrders.value = []
  } finally {
    loading.value = false
    recentOrdersLoading.value = false
  }
}

watch(locale, fetchUserData)
onMounted(fetchUserData)
</script>
