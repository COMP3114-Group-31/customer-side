<template>
  <div class="container mx-auto px-4 py-8">
    <div class="py-4">
      <nav class="flex text-sm text-gray-600">
        <router-link to="/" class="hover:text-primary">{{ $t('nav.home') }}</router-link>
        <span class="mx-2">/</span>
        <span class="text-gray-900">{{ $t('orders.title') }}</span>
      </nav>
    </div>

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('orders.title') }}</h1>
      <p class="text-gray-600 mt-2">{{ $t('ui.orderHistorySubtitle') }}</p>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
      <p class="text-gray-600">{{ $t('ui.loadingOrders') }}</p>
    </div>

    <div v-else-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      {{ errorMessage }}
    </div>

    <div v-else>
      <div class="mb-6">
        <span class="text-gray-700 mr-4">{{ $t('orders.filter') }}</span>
        <select v-model="filterStatus" class="border border-gray-300 rounded-lg px-4 py-2">
          <option value="">{{ $t('orders.all') }}</option>
          <option value="created">{{ $t('orders.created') }}</option>
          <option value="processing">{{ $t('orders.processing') }}</option>
          <option value="shipped">{{ $t('orders.shipped') }}</option>
          <option value="delivered">{{ $t('orders.delivered') }}</option>
          <option value="completed">{{ $t('ui.completed') }}</option>
          <option value="hold">{{ $t('ui.onHold') }}</option>
          <option value="cancelled">{{ $t('orders.cancelled') }}</option>
        </select>
      </div>

      <div class="bg-white rounded-xl shadow-lg p-6">
        <div v-if="orders.length === 0" class="text-center py-12 text-gray-500">
          <i class="fas fa-clipboard-list text-4xl mb-4"></i>
          <p class="text-lg">{{ $t('orders.noOrders') }}</p>
          <router-link to="/products" class="inline-block mt-6 bg-primary text-white px-6 py-3 rounded-button hover:bg-orange-600">
            {{ $t('ui.startShopping') }}
          </router-link>
        </div>

        <div v-else class="space-y-4">
          <div v-for="order in paginatedOrders" :key="order.order_id" class="border border-gray-200 rounded-lg p-4">
            <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <div class="text-sm text-gray-500">{{ $t('ui.orderLabel') }}</div>
                <div class="font-semibold text-gray-900">#{{ order.order_id }}</div>
              </div>

              <div>
                <div class="text-sm text-gray-500">{{ $t('ui.purchaseDate') }}</div>
                <div class="text-gray-900">{{ formatDate(order.purchase_date) }}</div>
              </div>

              <div>
                <div class="text-sm text-gray-500">{{ $t('ui.totalLabel') }}</div>
                <div class="font-bold text-primary">{{ formatPrice(order.total_amount) }}</div>
              </div>

              <div>
                <span :class="getStatusClass(order.status)" class="inline-block px-3 py-1 rounded-full text-sm">
                  {{ getStatusText(order.status) }}
                </span>
              </div>

              <div class="flex flex-wrap gap-2 xl:justify-end">
                <button
                  type="button"
                  class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  @click="toggleOrderDetails(order)"
                >
                  <i class="fas fa-receipt mr-2"></i>
                  {{ expandedOrders[order.order_id] ? $t('ui.hideDetails') : $t('ui.viewDetails') }}
                </button>

                <button
                  type="button"
                  class="px-4 py-2 rounded-lg text-white"
                  :class="canCancelOrder(order.status) ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 cursor-not-allowed'"
                  :disabled="!canCancelOrder(order.status) || cancellingOrders[order.order_id]"
                  @click="cancelOrder(order)"
                >
                  <span v-if="cancellingOrders[order.order_id]">
                    <i class="fas fa-spinner fa-spin mr-2"></i>{{ $t('ui.cancelling') }}
                  </span>
                  <span v-else>{{ $t('ui.cancelOrder') }}</span>
                </button>
              </div>
            </div>

            <div v-if="expandedOrders[order.order_id]" class="mt-6 border-t border-gray-200 pt-5">
              <div v-if="detailLoading[order.order_id]" class="text-center py-6 text-gray-500">
                <i class="fas fa-spinner fa-spin mr-2"></i>{{ $t('ui.loadingOrderDetails') }}
              </div>

              <div v-else-if="orderDetailErrors[order.order_id]" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {{ orderDetailErrors[order.order_id] }}
              </div>

              <div v-else>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-sm text-gray-500">{{ $t('ui.orderLabel') }}</div>
                    <div class="font-semibold text-gray-900 mt-1">#{{ order.order_id }}</div>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-sm text-gray-500">{{ $t('ui.statusLabel') }}</div>
                    <div class="font-semibold text-gray-900 mt-1">{{ getStatusText(getOrderDetail(order).status || order.status) }}</div>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-sm text-gray-500">{{ $t('ui.totalLabel') }}</div>
                    <div class="font-semibold text-primary mt-1">{{ formatPrice(getOrderDetail(order).total_amount || order.total_amount) }}</div>
                  </div>
                </div>

                <div v-if="getOrderDetail(order).shipping_address" class="mb-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('ui.shippingAddress') }}</h3>
                  <div class="bg-gray-50 rounded-lg p-4 whitespace-pre-line text-gray-700">
                    {{ getOrderDetail(order).shipping_address }}
                  </div>
                </div>

                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ $t('ui.orderItems') }}</h3>

                  <div v-if="normalizeOrderItems(getOrderDetail(order)).length === 0" class="bg-gray-50 rounded-lg p-4 text-gray-500">
                    {{ $t('ui.noOrderItems') }}
                  </div>

                  <div v-else class="space-y-3">
                    <div
                      v-for="(item, index) in normalizeOrderItems(getOrderDetail(order))"
                      :key="`${order.order_id}-${item.product_id || index}`"
                      class="border border-gray-200 rounded-lg p-4"
                    >
                      <div class="flex gap-4 items-start">
                        <router-link
                          v-if="item.product_id"
                          :to="`/product/${item.product_id}`"
                          class="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                        >
                          <img
                            v-if="item.thumbnail_url"
                            :src="getOrderItemImage(item)"
                            :alt="item.name"
                            class="w-full h-full object-cover"
                          >
                          <i v-else class="fas fa-image text-gray-400"></i>
                        </router-link>
                        <div v-else class="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                          <img
                            v-if="item.thumbnail_url"
                            :src="getOrderItemImage(item)"
                            :alt="item.name"
                            class="w-full h-full object-cover"
                          >
                          <i v-else class="fas fa-image text-gray-400"></i>
                        </div>

                        <div class="flex-1 min-w-0">
                          <router-link
                            v-if="item.product_id"
                            :to="`/product/${item.product_id}`"
                            class="font-semibold text-gray-900 hover:text-primary"
                          >
                            {{ item.name }}
                          </router-link>
                          <div v-else class="font-semibold text-gray-900">{{ item.name }}</div>

                          <div v-if="item.product_id" class="text-sm text-gray-500 mt-1">
                            {{ $t('ui.productIdLabel') }}: {{ item.product_id }}
                          </div>

                          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-sm">
                            <div>
                              <div class="text-gray-500">{{ $t('ui.quantityLabel') }}</div>
                              <div class="font-medium text-gray-900">{{ item.quantity }}</div>
                            </div>
                            <div>
                              <div class="text-gray-500">{{ $t('ui.unitPrice') }}</div>
                              <div class="font-medium text-gray-900">{{ formatPrice(item.unit_price) }}</div>
                            </div>
                            <div>
                              <div class="text-gray-500">{{ $t('ui.subtotal') }}</div>
                              <div class="font-medium text-primary">{{ formatPrice(item.subtotal) }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
            <i class="fas fa-chevron-left mr-1"></i> {{ $t('ui.previous') }}
          </button>
          <span>{{ $t('ui.pageXofY', { current: currentPage, total: totalPages }) }}</span>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            {{ $t('ui.next') }} <i class="fas fa-chevron-right ml-1"></i>
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
const { t, locale } = useI18n()
const orders = ref([])
const filterStatus = ref('')
const currentPage = ref(1)
const itemsPerPage = 6
const isLoading = ref(false)
const errorMessage = ref('')
const expandedOrders = ref({})
const orderDetails = ref({})
const detailLoading = ref({})
const orderDetailErrors = ref({})
const cancellingOrders = ref({})

const ORDER_STATUS_SEQUENCE = ['created', 'processing', 'shipped', 'delivered', 'completed', 'hold', 'cancelled']
const CANCELLABLE_STATUSES = ORDER_STATUS_SEQUENCE.slice(0, 3)

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
      errorMessage.value = t('ui.loginToViewOrders')
      setTimeout(() => router.push('/login'), 800)
    } else {
      errorMessage.value = error.message || t('ui.loadOrdersFailed')
    }
    orders.value = []
  } finally {
    isLoading.value = false
  }
}

const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
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
  const texts = {
    created: t('orders.created'),
    processing: t('orders.processing'),
    shipped: t('orders.shipped'),
    delivered: t('orders.delivered'),
    completed: t('ui.completed'),
    cancelled: t('orders.cancelled'),
    hold: t('ui.onHold')
  }
  return texts[status] || status
}

const normalizeOrderItems = (detail) => {
  const items = detail?.items || detail?.order_items || detail?.line_items || detail?.lines || []
  return (Array.isArray(items) ? items : []).map((item) => {
    const productId = item?.product_id ?? item?.id ?? item?.product?.id ?? null
    const quantity = Number(item?.quantity ?? item?.qty ?? 1)
    const unitPrice = Number(item?.unit_price ?? item?.price ?? item?.amount ?? 0)
    const subtotal = Number(item?.subtotal ?? item?.line_total ?? item?.total ?? (unitPrice * quantity) ?? 0)
    return {
      product_id: productId,
      name: item?.product_name ?? item?.name ?? item?.product?.name ?? `${t('ui.productLabel')} #${productId ?? ''}`.trim(),
      quantity,
      unit_price: unitPrice,
      subtotal,
      thumbnail_url:
        item?.thumbnail_url ??
        item?.image_url ??
        item?.product_thumbnail_url ??
        item?.product?.thumbnail_url ??
        item?.product?.thumbnail ??
        ''
    }
  })
}

const getOrderDetail = (order) => {
  return orderDetails.value[order.order_id] || order
}

const getOrderItemImage = (item) => {
  if (!item?.thumbnail_url) return ''
  return productsAPI.resolveAssetUrl(item.thumbnail_url)
}

const canCancelOrder = (status) => CANCELLABLE_STATUSES.includes(String(status || '').toLowerCase())

const loadOrderDetail = async (orderId) => {
  if (orderDetails.value[orderId]) return

  try {
    detailLoading.value[orderId] = true
    orderDetailErrors.value[orderId] = ''
    const detail = await ordersAPI.getOrderDetail(orderId)
    orderDetails.value[orderId] = detail || {}
  } catch (error) {
    console.error('Failed to fetch order detail:', error)
    orderDetailErrors.value[orderId] = error.message || t('ui.loadOrderDetailFailed')
  } finally {
    detailLoading.value[orderId] = false
  }
}

const toggleOrderDetails = async (order) => {
  const orderId = order.order_id
  expandedOrders.value[orderId] = !expandedOrders.value[orderId]

  if (expandedOrders.value[orderId]) {
    await loadOrderDetail(orderId)
  }
}

const cancelOrder = async (order) => {
  if (!canCancelOrder(order.status)) {
    alert(t('ui.cancelNotAvailable'))
    return
  }

  if (!confirm(t('ui.cancelOrderConfirm', { id: order.order_id }))) return

  try {
    cancellingOrders.value[order.order_id] = true
    await ordersAPI.cancelOrder(order.order_id)

    const target = orders.value.find((item) => item.order_id === order.order_id)
    if (target) target.status = 'cancelled'
    if (orderDetails.value[order.order_id]) {
      orderDetails.value[order.order_id] = {
        ...orderDetails.value[order.order_id],
        status: 'cancelled'
      }
    }

    alert(t('ui.cancelOrderSuccess'))
  } catch (error) {
    alert(error.message || t('ui.cancelOrderFailed'))
  } finally {
    cancellingOrders.value[order.order_id] = false
  }
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

watch(filterStatus, fetchOrders)
onMounted(fetchOrders)
</script>
