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

    <div v-if="loading" class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
      <p class="text-gray-600">{{ labels.loading }}</p>
    </div>

    <div
      v-else-if="errorMessage"
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
    >
      {{ errorMessage }}
    </div>

    <div v-else>
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <label class="text-gray-700 font-medium">{{ labels.filter }}</label>
        <select
          v-model="filterStatus"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary bg-white"
        >
          <option value="">{{ labels.all }}</option>
          <option
            v-for="status in filterableStatuses"
            :key="status"
            :value="status"
          >
            {{ getStatusText(status) }}
          </option>
        </select>
      </div>

      <div class="bg-white rounded-xl shadow-lg p-6">
        <div v-if="orders.length === 0" class="text-center py-12 text-gray-500">
          <i class="fas fa-clipboard-list text-4xl mb-4"></i>
          <p class="text-lg">{{ labels.noOrders }}</p>
          <router-link
            to="/products"
            class="inline-block mt-6 bg-primary text-white px-6 py-3 rounded-button hover:bg-orange-600"
          >
            {{ labels.startShopping }}
          </router-link>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="order in paginatedOrders"
            :key="order.order_id"
            class="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div class="p-4">
              <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <div class="text-sm text-gray-500">{{ labels.order }}</div>
                  <div class="font-semibold text-gray-900 text-xl">#{{ order.order_id }}</div>
                </div>

                <div>
                  <div class="text-sm text-gray-500">{{ labels.purchaseDate }}</div>
                  <div class="text-gray-900">{{ formatDateTime(order.purchase_date || order.created_at) }}</div>
                </div>

                <div>
                  <div class="text-sm text-gray-500">{{ labels.lastUpdated }}</div>
                  <div class="text-gray-900">{{ formatDateTime(order.updated_at || order.purchase_date || order.created_at) }}</div>
                </div>

                <div>
                  <div class="text-sm text-gray-500">{{ labels.total }}</div>
                  <div class="font-bold text-primary text-xl">{{ formatPrice(order.total_amount) }}</div>
                </div>

                <div class="md:text-right">
                  <span
                    :class="getStatusClass(order.status)"
                    class="inline-block px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {{ getStatusText(order.status) }}
                  </span>
                </div>
              </div>

              <div class="mt-4 flex flex-wrap gap-3 justify-end">
                <button
                  type="button"
                  class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  @click="toggleOrderDetail(order.order_id)"
                >
                  <span v-if="detailLoadingId === order.order_id">
                    <i class="fas fa-spinner fa-spin mr-2"></i>
                    {{ labels.loadingDetails }}
                  </span>
                  <span v-else>
                    <i class="fas mr-2" :class="expandedOrderId === order.order_id ? 'fa-chevron-up' : 'fa-receipt'"></i>
                    {{ expandedOrderId === order.order_id ? labels.hideDetails : labels.viewDetails }}
                  </span>
                </button>

                <button
                  type="button"
                  class="px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="canCancel(order.status) ? 'bg-primary hover:bg-orange-600' : 'bg-gray-300'"
                  :disabled="!canCancel(order.status) || cancellingOrderId === order.order_id"
                  @click="handleCancelOrder(order.order_id)"
                >
                  <span v-if="cancellingOrderId === order.order_id">
                    <i class="fas fa-spinner fa-spin mr-2"></i>
                    {{ labels.cancelling }}
                  </span>
                  <span v-else>{{ labels.cancelOrder }}</span>
                </button>
              </div>
            </div>

            <div
              v-if="expandedOrderId === order.order_id"
              class="border-t border-gray-200 bg-gray-50 px-4 py-5"
            >
              <div
                v-if="detailErrorById[order.order_id]"
                class="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4"
              >
                {{ detailErrorById[order.order_id] }}
              </div>

              <div v-else-if="detailById[order.order_id]" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div class="bg-white rounded-lg p-4 border border-gray-200">
                    <div class="text-sm text-gray-500">{{ labels.order }}</div>
                    <div class="font-semibold text-gray-900 text-lg">#{{ order.order_id }}</div>
                  </div>

                  <div class="bg-white rounded-lg p-4 border border-gray-200">
                    <div class="text-sm text-gray-500">{{ labels.statusLabel }}</div>
                    <div class="font-semibold text-gray-900 text-lg">{{ getStatusText(detailById[order.order_id].status || order.status) }}</div>
                  </div>

                  <div class="bg-white rounded-lg p-4 border border-gray-200">
                    <div class="text-sm text-gray-500">{{ labels.purchaseDate }}</div>
                    <div class="font-semibold text-gray-900">{{ formatDateTime(detailById[order.order_id].purchase_date || order.purchase_date || order.created_at) }}</div>
                  </div>

                  <div class="bg-white rounded-lg p-4 border border-gray-200">
                    <div class="text-sm text-gray-500">{{ labels.total }}</div>
                    <div class="font-semibold text-primary text-lg">{{ formatPrice(detailById[order.order_id].total_amount || order.total_amount) }}</div>
                  </div>
                </div>

                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">{{ labels.statusHistory }}</h3>

                  <div v-if="getStatusHistory(detailById[order.order_id]).length" class="space-y-3">
                    <div
                      v-for="(record, index) in getStatusHistory(detailById[order.order_id])"
                      :key="`${record.key}-${index}`"
                      class="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                    >
                      <div>
                        <div class="font-medium text-gray-900">{{ record.label }}</div>
                        <div class="text-sm text-gray-500">{{ record.note }}</div>
                      </div>
                      <div class="text-gray-900 font-medium">{{ formatDateTime(record.date) }}</div>
                    </div>
                  </div>

                  <div v-else class="bg-white border border-gray-200 rounded-lg p-4 text-gray-500">
                    {{ labels.noHistory }}
                  </div>
                </div>

                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">{{ labels.shippingAddress }}</h3>
                  <div class="bg-white rounded-lg p-4 border border-gray-200 text-gray-700 whitespace-pre-line">
                    {{ detailById[order.order_id].shipping_address || labels.noAddress }}
                  </div>
                </div>

                <div class="flex justify-end" v-if="canCancel(detailById[order.order_id].status || order.status)">
                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm"
                    :disabled="cancellingOrderId === order.order_id"
                    @click="handleCancelOrder(order.order_id)"
                  >
                    <span v-if="cancellingOrderId === order.order_id">
                      <i class="fas fa-spinner fa-spin mr-2"></i>{{ labels.cancelling }}
                    </span>
                    <span v-else>{{ labels.cancelOrder }}</span>
                  </button>
                </div>

                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">{{ labels.orderItems }}</h3>
                  <div class="space-y-3">
                    <div
                      v-for="item in getOrderItems(detailById[order.order_id])"
                      :key="`${item.product_id}-${item.name}`"
                      class="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div class="flex flex-col md:flex-row gap-4">
                        <button
                          type="button"
                          class="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center shrink-0"
                          @click="openProduct(item.product_id)"
                        >
                          <img
                            v-if="getItemImage(item)"
                            :src="getItemImage(item)"
                            :alt="item.name"
                            class="w-full h-full object-cover"
                          >
                          <i v-else class="fas fa-image text-gray-400"></i>
                        </button>

                        <div class="flex-1 min-w-0">
                          <button
                            type="button"
                            class="text-left hover:text-primary"
                            @click="openProduct(item.product_id)"
                          >
                            <h4 class="font-semibold text-gray-900 text-lg">
                              {{ item.name || `${labels.product} #${item.product_id}` }}
                            </h4>
                          </button>

                          <div class="text-sm text-gray-500 mt-1">
                            {{ labels.productId }}: {{ item.product_id }}
                          </div>

                          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-sm">
                            <div>
                              <div class="text-gray-500">{{ labels.quantity }}</div>
                              <div class="font-medium text-gray-900">{{ Number(item.quantity || 0) }}</div>
                            </div>

                            <div>
                              <div class="text-gray-500">{{ labels.unitPrice }}</div>
                              <div class="font-medium text-gray-900">{{ formatPrice(item.unit_price || item.price) }}</div>
                            </div>

                            <div>
                              <div class="text-gray-500">{{ labels.subtotal }}</div>
                              <div class="font-semibold text-primary">
                                {{ formatPrice(item.subtotal || (Number(item.quantity || 0) * Number(item.unit_price || item.price || 0))) }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-gray-500">{{ labels.detailUnavailable }}</div>
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
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ordersAPI, productsAPI } from '../api'

const router = useRouter()
const { locale } = useI18n()

const orders = ref([])
const filterStatus = ref('')
const currentPage = ref(1)
const itemsPerPage = 6
const loading = ref(false)
const errorMessage = ref('')
const expandedOrderId = ref(null)
const detailLoadingId = ref(null)
const cancellingOrderId = ref(null)
const detailById = ref({})
const detailErrorById = ref({})

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))

const labels = computed(() => isZh.value ? {
  home: '首页',
  title: '我的订单',
  subtitle: '查看你的订单记录',
  loading: '正在加载订单...',
  filter: '筛选状态',
  all: '全部订单',
  noOrders: '暂无订单',
  startShopping: '开始购物',
  order: '订单',
  purchaseDate: '下单时间',
  lastUpdated: '最后更新',
  total: '总计',
  statusLabel: '状态',
  statusHistory: '状态变更记录',
  shippingAddress: '收货地址',
  noAddress: '暂无收货地址',
  noHistory: '暂无状态记录',
  orderItems: '订单商品',
  cancelOrder: '取消订单',
  cancelling: '取消中...',
  quantity: '数量',
  unitPrice: '单价',
  subtotal: '小计',
  productId: '商品编号',
  product: '商品',
  previous: '上一页',
  next: '下一页',
  page: (p, t) => `第 ${p} / ${t} 页`,
  viewDetails: '查看详情',
  hideDetails: '收起详情',
  loadingDetails: '加载详情中...',
  detailUnavailable: '暂无订单详情',
  loginRequired: '请先登录后查看订单。',
  loadFailed: '加载订单失败。',
  cancelConfirm: (id) => `确定要取消订单 #${id} 吗？`,
  cancelFailed: '取消订单失败。',
  statusText: {
    created: '已创建',
    processing: '处理中',
    shipped: '已发货',
    delivered: '已送达',
    completed: '已完成',
    cancelled: '已取消',
    hold: '已挂起',
    refunded: '已退款',
    refunding: '退款中'
  }
} : {
  home: 'Home',
  title: 'My Orders',
  subtitle: 'View your order history',
  loading: 'Loading orders...',
  filter: 'Filter by status',
  all: 'All Orders',
  noOrders: 'No orders yet',
  startShopping: 'Start Shopping',
  order: 'Order',
  purchaseDate: 'Purchase Date',
  lastUpdated: 'Last Updated',
  total: 'Total',
  statusLabel: 'Status',
  statusHistory: 'Status History',
  shippingAddress: 'Shipping Address',
  noAddress: 'No shipping address available.',
  noHistory: 'No status history available.',
  orderItems: 'Order Items',
  cancelOrder: 'Cancel Order',
  cancelling: 'Cancelling...',
  quantity: 'Quantity',
  unitPrice: 'Unit Price',
  subtotal: 'Subtotal',
  productId: 'Product ID',
  product: 'Product',
  previous: 'Previous',
  next: 'Next',
  page: (p, t) => `Page ${p} of ${t}`,
  viewDetails: 'View Details',
  hideDetails: 'Hide Details',
  loadingDetails: 'Loading details...',
  detailUnavailable: 'No detail available.',
  loginRequired: 'Please login to view your orders.',
  loadFailed: 'Failed to load orders.',
  cancelConfirm: (id) => `Cancel order #${id}?`,
  cancelFailed: 'Failed to cancel order.',
  statusText: {
    created: 'Created',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
    hold: 'On Hold',
    refunded: 'Refunded',
    refunding: 'Refunding'
  }
})

const filterableStatuses = ['created', 'processing', 'shipped', 'delivered', 'completed', 'hold', 'cancelled']

const totalPages = computed(() => Math.max(1, Math.ceil(orders.value.length / itemsPerPage)))
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return orders.value.slice(start, start + itemsPerPage)
})

const normalizeStatus = (status) => {
  const value = String(status || '').trim().toLowerCase()
  if (value === 'on hold') return 'hold'
  return value
}

const getStatusText = (status) => labels.value.statusText[normalizeStatus(status)] || status || ''
const canCancel = (status) => ['created', 'processing', 'hold'].includes(normalizeStatus(status))

const getStatusClass = (status) => {
  const classes = {
    created: 'bg-blue-100 text-blue-800',
    processing: 'bg-yellow-100 text-yellow-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    hold: 'bg-orange-100 text-orange-800',
    refunded: 'bg-gray-200 text-gray-800',
    refunding: 'bg-pink-100 text-pink-800'
  }
  return classes[normalizeStatus(status)] || 'bg-gray-100 text-gray-800'
}

const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString(isZh.value ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: isZh.value ? 'long' : 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const STATUS_HISTORY_FIELDS = [
  ['purchase_date', 'created'],
  ['created_at', 'created'],
  ['processing_date', 'processing'],
  ['shipment_date', 'shipped'],
  ['shipped_date', 'shipped'],
  ['delivered_date', 'delivered'],
  ['completed_date', 'completed'],
  ['cancel_date', 'cancelled'],
  ['cancelled_date', 'cancelled'],
  ['refund_date', 'refunded'],
  ['refunded_date', 'refunded']
]

const getHistoryNote = (status, fromStatus = '') => {
  const toText = getStatusText(status)
  const fromText = fromStatus ? getStatusText(fromStatus) : ''
  if (fromText) {
    return isZh.value ? `状态从 ${fromText} 变更为 ${toText}` : `Status changed from ${fromText} to ${toText}`
  }
  return isZh.value ? `状态变更为 ${toText}` : `Status changed to ${toText}`
}

const normalizeDateKey = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value || '').trim()
  return date.toISOString()
}

const getStatusHistory = (detail) => {
  if (!detail || typeof detail !== 'object') return []

  const history = []
  const seen = new Set()

  const pushRecord = (key, status, date, note = '') => {
    const normalizedStatus = normalizeStatus(status)
    if (!date || !normalizedStatus) return

    const dedupeKey = `${normalizedStatus}:${normalizeDateKey(date)}`
    if (seen.has(dedupeKey)) return
    seen.add(dedupeKey)

    history.push({
      key,
      status: normalizedStatus,
      date,
      label: getStatusText(normalizedStatus),
      note: note || getHistoryNote(normalizedStatus)
    })
  }

  if (Array.isArray(detail.status_history)) {
    for (const entry of detail.status_history) {
      const status = normalizeStatus(entry.to_status || entry.status || entry.key || entry.type)
      const fromStatus = normalizeStatus(entry.from_status || '')
      const date = entry.date || entry.changed_at || entry.timestamp || entry.time
      pushRecord(`history-${status}`, status, date, getHistoryNote(status, fromStatus))
    }
  }

  for (const [field, status] of STATUS_HISTORY_FIELDS) {
    pushRecord(field, status, detail[field], getHistoryNote(status))
  }

  if (history.length === 0 && (detail.purchase_date || detail.updated_at)) {
    pushRecord('purchase_date', 'created', detail.purchase_date || detail.updated_at, getHistoryNote('created'))
    const currentStatus = normalizeStatus(detail.status)
    if (currentStatus && currentStatus !== 'created' && detail.updated_at) {
      pushRecord('updated_at', currentStatus, detail.updated_at, getHistoryNote(currentStatus))
    }
  }

  return history.sort((a, b) => new Date(a.date) - new Date(b.date))
}

const getOrderItems = (detail) => {
  if (!detail || typeof detail !== 'object') return []
  const candidates = [detail.items, detail.order_items, detail.products, detail.lines]
  const list = candidates.find((value) => Array.isArray(value)) || []
  return list.map((item) => ({
    ...item,
    product_id: item.product_id ?? item.id ?? item.product?.id ?? item.product?.product_id,
    name: item.name ?? item.product_name ?? item.product?.name ?? `${labels.value.product} #${item.product_id ?? item.id ?? ''}`,
    quantity: item.quantity ?? item.qty ?? 0,
    unit_price: item.unit_price ?? item.price ?? item.product?.price ?? 0,
    subtotal: item.subtotal ?? item.line_total ?? item.total ?? null,
    thumbnail_url:
      item.thumbnail_url ??
      item.thumbnail ??
      item.image_url ??
      item.product?.thumbnail_url ??
      item.product?.thumbnail ??
      item.product?.image_url ??
      ''
  }))
}

const getItemImage = (item) => {
  if (item?.thumbnail_url) return productsAPI.resolveAssetUrl(item.thumbnail_url)
  return ''
}

const fetchOrders = async () => {
  loading.value = true
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
    loading.value = false
  }
}

const toggleOrderDetail = async (orderId) => {
  if (expandedOrderId.value === orderId) {
    expandedOrderId.value = null
    return
  }

  expandedOrderId.value = orderId

  if (detailById.value[orderId]) return

  detailLoadingId.value = orderId
  detailErrorById.value = {
    ...detailErrorById.value,
    [orderId]: ''
  }

  try {
    const result = await ordersAPI.getOrderDetail(orderId)
    detailById.value = {
      ...detailById.value,
      [orderId]: result?.order || result
    }
  } catch (error) {
    console.error('Failed to fetch order detail:', error)
    detailErrorById.value = {
      ...detailErrorById.value,
      [orderId]: error.message || labels.value.detailUnavailable
    }
  } finally {
    detailLoadingId.value = null
  }
}

const openProduct = (productId) => {
  if (!productId) return
  router.push(`/product/${productId}`)
}

const handleCancelOrder = async (orderId) => {
  const target = orders.value.find((order) => order.order_id === orderId)
  if (!target || !canCancel(target.status)) return

  if (!window.confirm(labels.value.cancelConfirm(orderId))) return

  cancellingOrderId.value = orderId

  try {
    await ordersAPI.cancelOrder(orderId)
    detailById.value = {
      ...detailById.value,
      [orderId]: undefined
    }
    await fetchOrders()

    const refreshed = orders.value.find((order) => order.order_id === orderId)
    if (refreshed && expandedOrderId.value === orderId) {
      await toggleOrderDetail(orderId)
    }
  } catch (error) {
    console.error('Failed to cancel order:', error)
    alert(error.message || labels.value.cancelFailed)
  } finally {
    cancellingOrderId.value = null
  }
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

watch(filterStatus, fetchOrders)
watch(locale, () => {})

onMounted(fetchOrders)
</script>
