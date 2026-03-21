<template>
  <div class="container mx-auto px-4 py-8">
    <div class="py-4">
      <nav class="flex text-sm text-gray-600">
        <router-link to="/" class="hover:text-primary">{{ labels.home }}</router-link>
        <span class="mx-2">/</span>
        <span class="text-gray-900">{{ labels.title }}</span>
      </nav>
    </div>

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ labels.title }}</h1>
      <p class="text-gray-600 mt-2">{{ labels.subtitle }}</p>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
      <p class="text-gray-600">{{ labels.loading }}</p>
    </div>

    <div v-else-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      {{ errorMessage }}
    </div>

    <div v-else>
      <div class="mb-6">
        <span class="text-gray-700 mr-4">{{ labels.filter }}</span>
        <select v-model="filterStatus" class="border border-gray-300 rounded-lg px-4 py-2">
          <option value="">{{ labels.all }}</option>
          <option value="created">{{ labels.created }}</option>
          <option value="processing">{{ labels.processing }}</option>
          <option value="shipped">{{ labels.shipped }}</option>
          <option value="delivered">{{ labels.delivered }}</option>
          <option value="completed">{{ labels.completed }}</option>
          <option value="hold">{{ labels.hold }}</option>
          <option value="cancelled">{{ labels.cancelled }}</option>
        </select>
      </div>

      <div class="bg-white rounded-xl shadow-lg p-6">
        <div v-if="orders.length === 0" class="text-center py-12 text-gray-500">
          <i class="fas fa-clipboard-list text-4xl mb-4"></i>
          <p class="text-lg">{{ labels.noOrders }}</p>
          <router-link to="/products" class="inline-block mt-6 bg-primary text-white px-6 py-3 rounded-button hover:bg-orange-600">
            {{ labels.startShopping }}
          </router-link>
        </div>

        <div v-else class="space-y-4">
          <div v-for="order in paginatedOrders" :key="order.order_id" class="border border-gray-200 rounded-lg p-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div class="text-sm text-gray-500">{{ labels.order }}</div>
                <div class="font-semibold text-gray-900">#{{ order.order_id }}</div>
              </div>

              <div>
                <div class="text-sm text-gray-500">{{ labels.purchaseDate }}</div>
                <div class="text-gray-900">{{ formatDate(order.purchase_date) }}</div>
              </div>

              <div>
                <div class="text-sm text-gray-500">{{ labels.total }}</div>
                <div class="font-bold text-primary">{{ formatPrice(order.total_amount) }}</div>
              </div>

              <div>
                <span :class="getStatusClass(order.status)" class="inline-block px-3 py-1 rounded-full text-sm">
                  {{ getStatusText(order.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="totalPages > 1" class="mt-8 flex justify-center items-center gap-3">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            <i class="fas fa-chevron-left mr-1"></i>{{ labels.previous }}
          </button>
          <span>{{ labels.page(currentPage, totalPages) }}</span>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            {{ labels.next }} <i class="fas fa-chevron-right ml-1"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ordersAPI } from '../api'

const router = useRouter()
const { locale } = useI18n()
const orders = ref([])
const filterStatus = ref('')
const currentPage = ref(1)
const itemsPerPage = 6
const isLoading = ref(false)
const errorMessage = ref('')

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))
const labels = computed(() => isZh.value ? {
  home: '首页',
  title: '我的订单',
  subtitle: '查看你的订单记录',
  loading: '正在加载订单...',
  filter: '筛选状态',
  all: '全部订单',
  created: '已创建',
  processing: '处理中',
  shipped: '已发货',
  delivered: '已送达',
  completed: '已完成',
  hold: '挂起',
  cancelled: '已取消',
  noOrders: '暂无订单',
  startShopping: '开始购物',
  order: '订单',
  purchaseDate: '下单时间',
  total: '总计',
  previous: '上一页',
  next: '下一页',
  page: (p, t) => `第 ${p} / ${t} 页`,
  loginRequired: '请先登录后查看订单。',
  loadFailed: '加载订单失败。'
} : {
  home: 'Home',
  title: 'My Orders',
  subtitle: 'View your order history',
  loading: 'Loading orders...',
  filter: 'Filter by status',
  all: 'All Orders',
  created: 'Created',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  hold: 'On Hold',
  cancelled: 'Cancelled',
  noOrders: 'No orders yet',
  startShopping: 'Start Shopping',
  order: 'Order',
  purchaseDate: 'Purchase Date',
  total: 'Total',
  previous: 'Previous',
  next: 'Next',
  page: (p, t) => `Page ${p} of ${t}`,
  loginRequired: 'Please login to view your orders.',
  loadFailed: 'Failed to load orders.'
})

const totalPages = computed(() => Math.max(1, Math.ceil(orders.value.length / itemsPerPage)))
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return orders.value.slice(start, start + itemsPerPage)
})

const fetchOrders = async () => {
  isLoading.value = true
  errorMessage.value = ''
  currentPage.value = 1

  try {
    const result = await ordersAPI.getOrders(filterStatus.value || '')
    orders.value = result?.orders || []
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    if (error.status === 401) {
      errorMessage.value = labels.value.loginRequired
      setTimeout(() => router.push('/login'), 800)
    } else {
      errorMessage.value = error.message || labels.value.loadFailed
    }
    orders.value = []
  } finally {
    isLoading.value = false
  }
}

const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString(isZh.value ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: isZh.value ? 'long' : 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusClass = (status) => {
  const classes = {
    created: 'bg-blue-100 text-blue-800',
    processing: 'bg-yellow-100 text-yellow-800',
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
  const zhMap = {
    created: '已创建',
    processing: '处理中',
    shipped: '已发货',
    delivered: '已送达',
    completed: '已完成',
    cancelled: '已取消',
    hold: '挂起'
  }
  const enMap = {
    created: 'Created',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
    hold: 'On Hold'
  }
  return (isZh.value ? zhMap[key] : enMap[key]) || status
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

watch(filterStatus, fetchOrders)
watch(locale, fetchOrders)
onMounted(fetchOrders)
</script>
