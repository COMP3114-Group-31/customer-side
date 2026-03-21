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
      <p class="text-gray-600 mt-2">{{ cartItems.length }} {{ labels.items }}</p>
    </div>

    <div v-if="loading" class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-2xl text-primary"></i>
      <p class="mt-2 text-gray-600">{{ labels.loading }}</p>
    </div>

    <div v-else class="flex flex-col lg:flex-row gap-8">
      <div class="lg:w-2/3">
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div v-if="cartItems.length === 0" class="text-center py-12">
            <i class="fas fa-shopping-cart text-4xl text-gray-300 mb-4"></i>
            <p class="text-gray-500 text-lg">{{ labels.emptyCart }}</p>
            <router-link to="/products" class="inline-block mt-6 bg-primary text-white px-6 py-3 rounded-button hover:bg-orange-600">
              {{ labels.continue }}
            </router-link>
          </div>

          <div v-else class="space-y-5">
            <div v-for="item in cartItems" :key="item.product_id" class="border border-gray-200 rounded-lg p-4">
              <div class="flex gap-4">
                <div class="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    v-if="getItemImage(item)"
                    :src="getItemImage(item)"
                    :alt="item.name"
                    class="w-full h-full object-cover"
                  >
                  <i v-else class="fas fa-image text-gray-400"></i>
                </div>

                <div class="flex-1">
                  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 class="font-semibold text-gray-900">{{ item.name }}</h2>
                      <p class="text-sm text-gray-500">{{ labels.productIdLabel }}: {{ item.product_id }}</p>
                      <p class="text-lg font-bold text-primary mt-2">{{ formatPrice(item.price) }}</p>
                      <button class="mt-2 text-sm text-primary hover:underline" @click="goToProduct(item.product_id)">
                        {{ labels.viewProductDetail }}
                      </button>
                    </div>

                    <div class="flex items-center gap-4">
                      <div class="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button
                          class="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                          @click="updateQuantity(item.product_id, item.quantity - 1)"
                          :disabled="updatingCart[item.product_id]"
                        >
                          <i class="fas fa-minus text-xs"></i>
                        </button>
                        <span class="w-12 h-8 flex items-center justify-center border-x border-gray-300">
                          <span v-if="updatingCart[item.product_id]" class="fas fa-spinner fa-spin"></span>
                          <span v-else>{{ item.quantity }}</span>
                        </span>
                        <button
                          class="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                          @click="updateQuantity(item.product_id, item.quantity + 1)"
                          :disabled="updatingCart[item.product_id]"
                        >
                          <i class="fas fa-plus text-xs"></i>
                        </button>
                      </div>

                      <div class="text-right min-w-24">
                        <div class="text-sm text-gray-500">{{ labels.subtotal }}</div>
                        <div class="font-bold text-gray-900">{{ formatPrice(item.subtotal ?? item.price * item.quantity) }}</div>
                      </div>

                      <button
                        class="text-gray-500 hover:text-red-500"
                        @click="removeFromCart(item.product_id)"
                        :disabled="removingCart[item.product_id]"
                      >
                        <span v-if="removingCart[item.product_id]" class="fas fa-spinner fa-spin"></span>
                        <i v-else class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-8 flex justify-between items-center">
              <router-link to="/products" class="text-primary hover:underline flex items-center">
                <i class="fas fa-arrow-left mr-2"></i>
                {{ labels.continue }}
              </router-link>
              <button
                class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 !rounded-button transition-colors duration-200"
                @click="clearCart"
                :disabled="clearingCart"
              >
                <span v-if="clearingCart" class="fas fa-spinner fa-spin mr-2"></span>
                {{ labels.clearCart }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="cartItems.length > 0" class="lg:w-1/3">
        <div class="bg-white rounded-xl shadow-lg p-6 sticky top-24">
          <h2 class="text-xl font-bold text-gray-900 mb-6">{{ labels.summary }}</h2>

          <div class="space-y-4 mb-6">
            <div class="flex justify-between">
              <span class="text-gray-600">{{ labels.subtotalLabel }}</span>
              <span class="font-medium">{{ formatPrice(totalAmount) }}</span>
            </div>
            <div class="border-t border-gray-200 pt-4">
              <div class="flex justify-between">
                <span class="text-lg font-bold text-gray-900">{{ labels.total }}</span>
                <span class="text-2xl font-bold text-primary">{{ formatPrice(totalAmount) }}</span>
              </div>
            </div>
          </div>

          <button
            class="w-full bg-primary hover:bg-orange-600 text-white py-3 px-6 !rounded-button font-bold text-lg transition-colors duration-200"
            @click="checkout"
            :disabled="checkingOut"
          >
            <span v-if="checkingOut" class="fas fa-spinner fa-spin mr-2"></span>
            {{ checkingOut ? labels.processing : labels.checkout }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { cartAPI, ordersAPI, productsAPI } from '../api'

const router = useRouter()
const { locale } = useI18n()

const loading = ref(false)
const cartItems = ref([])
const checkingOut = ref(false)
const clearingCart = ref(false)
const updatingCart = ref({})
const removingCart = ref({})

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))
const labels = computed(() => isZh.value ? {
  home: '首页',
  title: '购物车',
  items: '件商品',
  loading: '正在加载购物车...',
  emptyCart: '购物车还是空的',
  continue: '继续购物',
  productIdLabel: '商品编号',
  viewProductDetail: '查看商品详情',
  subtotal: '小计',
  clearCart: '清空购物车',
  summary: '订单摘要',
  subtotalLabel: '商品小计',
  total: '总计',
  checkout: '去结算',
  processing: '处理中...',
  confirmRemove: '确定要删除这件商品吗？',
  confirmClear: '确定要清空购物车吗？',
  orderCreated: (id) => `订单创建成功，订单号：${id}`,
  updateFailed: '更新数量失败。',
  removeFailed: '删除商品失败。',
  clearFailed: '清空购物车失败。',
  checkoutFailed: '结算失败，请稍后重试。'
} : {
  home: 'Home',
  title: 'Shopping Cart',
  items: 'items',
  loading: 'Loading cart...',
  emptyCart: 'Your cart is empty',
  continue: 'Continue Shopping',
  productIdLabel: 'Product ID',
  viewProductDetail: 'View Product Detail',
  subtotal: 'Subtotal',
  clearCart: 'Clear Cart',
  summary: 'Order Summary',
  subtotalLabel: 'Subtotal',
  total: 'Total',
  checkout: 'Proceed to Checkout',
  processing: 'Processing...',
  confirmRemove: 'Remove this item from cart?',
  confirmClear: 'Clear your cart?',
  orderCreated: (id) => `Order created successfully. Order ID: ${id}`,
  updateFailed: 'Failed to update quantity.',
  removeFailed: 'Failed to remove item.',
  clearFailed: 'Failed to clear cart.',
  checkoutFailed: 'Checkout failed. Please try again.'
})

const totalAmount = computed(() => {
  return cartItems.value.reduce((sum, item) => {
    const lineTotal = item.subtotal ?? ((Number(item.price) || 0) * (Number(item.quantity) || 0))
    return sum + Number(lineTotal || 0)
  }, 0)
})

const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`

const getItemImage = (item) => {
  if (item?.thumbnail_url) return productsAPI.resolveAssetUrl(item.thumbnail_url)
  return ''
}

const fetchCart = async () => {
  try {
    loading.value = true
    const data = await cartAPI.getCart()
    cartItems.value = data?.items || []
  } catch (error) {
    console.error('Failed to fetch cart:', error)
    if (error.status === 401) {
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

const updateQuantity = async (productId, newQuantity) => {
  if (newQuantity < 1) {
    removeFromCart(productId)
    return
  }

  try {
    updatingCart.value[productId] = true
    await cartAPI.updateCartItem(productId, newQuantity)
    const itemIndex = cartItems.value.findIndex((item) => item.product_id === productId)
    if (itemIndex !== -1) {
      const item = cartItems.value[itemIndex]
      item.quantity = newQuantity
      item.subtotal = Number(item.price || 0) * newQuantity
    }
  } catch (error) {
    alert(error.message || labels.value.updateFailed)
  } finally {
    updatingCart.value[productId] = false
  }
}

const removeFromCart = async (productId) => {
  if (!confirm(labels.value.confirmRemove)) return

  try {
    removingCart.value[productId] = true
    await cartAPI.removeFromCart(productId)
    cartItems.value = cartItems.value.filter((item) => item.product_id !== productId)
  } catch (error) {
    alert(error.message || labels.value.removeFailed)
  } finally {
    removingCart.value[productId] = false
  }
}

const clearCart = async () => {
  if (!confirm(labels.value.confirmClear)) return

  try {
    clearingCart.value = true
    await cartAPI.clearCart()
    cartItems.value = []
  } catch (error) {
    alert(error.message || labels.value.clearFailed)
  } finally {
    clearingCart.value = false
  }
}

const checkout = async () => {
  try {
    checkingOut.value = true
    const result = await ordersAPI.checkout()
    alert(labels.value.orderCreated(result?.order_id || ''))
    cartItems.value = []
    router.push('/orders')
  } catch (error) {
    alert(error.message || labels.value.checkoutFailed)
  } finally {
    checkingOut.value = false
  }
}

const goToProduct = (productId) => {
  if (!productId) return
  router.push(`/product/${productId}`)
}

onMounted(fetchCart)
</script>
