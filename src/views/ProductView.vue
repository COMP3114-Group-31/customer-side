<template>
  <div class="container mx-auto px-4 py-8">
    <div class="py-4">
      <nav class="flex text-sm text-gray-600">
        <router-link to="/" class="hover:text-primary">{{ labels.home }}</router-link>
        <span class="mx-2">/</span>
        <router-link to="/products" class="hover:text-primary">{{ labels.products }}</router-link>
        <span class="mx-2">/</span>
        <span class="text-gray-900">{{ product.name || labels.product }}</span>
      </nav>
    </div>

    <div v-if="isLoading" class="text-center py-16">
      <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
      <p class="text-gray-600">{{ labels.loading }}</p>
    </div>

    <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
      {{ errorMessage }}
    </div>

    <div v-else class="bg-white rounded-xl shadow-lg overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
        <section>
          <div class="w-full h-96 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mb-4">
            <img
              v-if="selectedImage && !mainImageFailed"
              :src="selectedImage"
              :alt="product.name"
              class="w-full h-full object-cover"
              @error="mainImageFailed = true"
            >
            <div v-else class="text-gray-500 flex flex-col items-center gap-2">
              <i class="fas fa-image text-4xl"></i>
              <span>{{ labels.noImage }}</span>
            </div>
          </div>

          <div v-if="imageList.length > 1" class="grid grid-cols-4 gap-3">
            <button
              v-for="(image, index) in imageList"
              :key="`${image}-${index}`"
              type="button"
              class="h-24 rounded-lg overflow-hidden border-2 bg-gray-100"
              :class="selectedImageIndex === index ? 'border-primary' : 'border-transparent'"
              @click="selectImage(index)"
            >
              <img :src="image" :alt="labels.imageAlt" class="w-full h-full object-cover">
            </button>
          </div>
        </section>

        <section>
          <h1 class="text-3xl font-bold text-gray-900 mb-3">{{ product.name }}</h1>

          <div class="mb-4">
            <span class="text-4xl font-bold text-primary">{{ formatPrice(product.price) }}</span>
          </div>

          <div class="mb-4">
            <span
              :class="[
                'inline-block px-3 py-1 rounded-full text-sm',
                isProductAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              ]"
            >
              {{ isProductAvailable ? labels.inStock : labels.unavailable }}
            </span>
          </div>

          <div v-if="product.description" class="mb-6 text-gray-700 leading-7">
            {{ product.description }}
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ labels.quantity }}</label>
            <div class="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
              <button
                type="button"
                class="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                :disabled="quantity <= 1"
                @click="decreaseQuantity"
              >
                <i class="fas fa-minus"></i>
              </button>
              <div class="w-16 h-10 flex items-center justify-center border-x border-gray-300">
                {{ quantity }}
              </div>
              <button
                type="button"
                class="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                :disabled="quantity >= maxQuantity"
                @click="increaseQuantity"
              >
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>

          <button
            @click="addToCart"
            :disabled="!isProductAvailable || isAddingToCart"
            :class="[
              'w-full sm:w-auto text-white py-3 px-8 !rounded-button font-medium transition-colors duration-200',
              !isProductAvailable || isAddingToCart ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-orange-600'
            ]"
          >
            <span v-if="isAddingToCart">
              <i class="fas fa-spinner fa-spin mr-2"></i>
              {{ labels.adding }}
            </span>
            <span v-else>
              <i class="fas fa-shopping-cart mr-2"></i>
              {{ labels.addToCart }}
            </span>
          </button>

          <div class="mt-8 border-t border-gray-200 pt-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ labels.productDetails }}</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-gray-500">{{ labels.productId }}</div>
                <div class="font-medium text-gray-900">{{ displayProductId }}</div>
              </div>
              <div v-if="product.category">
                <div class="text-gray-500">{{ labels.category }}</div>
                <div class="font-medium text-gray-900">{{ formatCategory(product.category) }}</div>
              </div>
              <div v-if="product.updated_at">
                <div class="text-gray-500">{{ labels.lastUpdated }}</div>
                <div class="font-medium text-gray-900">{{ formatDate(product.updated_at) }}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { cartAPI, productsAPI } from '../api'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()

const product = ref({})
const quantity = ref(1)
const selectedImageIndex = ref(0)
const mainImageFailed = ref(false)
const isLoading = ref(false)
const isAddingToCart = ref(false)
const errorMessage = ref('')

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))
const labels = computed(() => isZh.value ? {
  home: '首页',
  products: '商品',
  product: '商品',
  loading: '正在加载商品详情...',
  noImage: '暂无图片',
  imageAlt: '商品图片',
  inStock: '有库存',
  unavailable: '暂不可用',
  quantity: '数量',
  adding: '加入中...',
  addToCart: '加入购物车',
  productDetails: '商品详情',
  productId: '商品编号',
  category: '分类',
  lastUpdated: '最后更新',
  addedToCart: (q, name) => `已将 ${q} 件 ${name} 加入购物车。`,
  loadFailed: '加载商品详情失败。',
  notFound: '商品不存在。'
} : {
  home: 'Home',
  products: 'Products',
  product: 'Product',
  loading: 'Loading product details...',
  noImage: 'No image',
  imageAlt: 'Product image',
  inStock: 'In Stock',
  unavailable: 'Unavailable',
  quantity: 'Quantity',
  adding: 'Adding...',
  addToCart: 'Add to Cart',
  productDetails: 'Product Details',
  productId: 'Product ID',
  category: 'Category',
  lastUpdated: 'Last Updated',
  addedToCart: (q, name) => `Added ${q} × ${name} to cart.`,
  loadFailed: 'Failed to load product details.',
  notFound: 'Product not found.'
})

const getProductId = (item) => item?.id ?? item?.product_id ?? item?._id ?? route.params.id

const imageList = computed(() => {
  const productId = getProductId(product.value)
  const urls = []

  if (product.value?.thumbnail_url) {
    urls.push(productsAPI.resolveAssetUrl(product.value.thumbnail_url))
  }

  if (Array.isArray(product.value?.images)) {
    for (const image of product.value.images) {
      if (!image) continue
      if (typeof image === 'string') {
        urls.push(productsAPI.getProductImageUrl(productId, image))
      } else {
        const url = image.url || image.image_url || image.src
        const filename = image.filename || image.name
        if (url) urls.push(productsAPI.resolveAssetUrl(url))
        else if (filename) urls.push(productsAPI.getProductImageUrl(productId, filename))
      }
    }
  }

  if (Array.isArray(product.value?.image_filenames)) {
    for (const filename of product.value.image_filenames) {
      urls.push(productsAPI.getProductImageUrl(productId, filename))
    }
  }

  return [...new Set(urls.filter(Boolean))]
})

const selectedImage = computed(() => imageList.value[selectedImageIndex.value] || '')
const displayProductId = computed(() => getProductId(product.value))

const isProductAvailable = computed(() => {
  if (product.value?.status === 'inactive') return false
  return true
})

const maxQuantity = computed(() => {
  const stock = Number(product.value?.stock_quantity)
  if (Number.isFinite(stock) && stock > 0) return stock
  return 10
})

const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`
const formatDate = (value) => new Date(value).toLocaleString()
const formatCategory = (value) => {
  const key = String(value || '').toLowerCase()
  const zhMap = { phone: '手机', tablet: '平板', laptop: '笔记本', accessory: '配件', other: '其他', audio: '音频', wearable: '穿戴设备', wearables: '穿戴设备' }
  const enMap = { phone: 'Phone', tablet: 'Tablet', laptop: 'Laptop', accessory: 'Accessory', other: 'Other', audio: 'Audio', wearable: 'Wearable', wearables: 'Wearables' }
  return (isZh.value ? zhMap[key] : enMap[key]) || value || '-'
}

const selectImage = (index) => {
  selectedImageIndex.value = index
  mainImageFailed.value = false
}

const fetchProductDetail = async () => {
  isLoading.value = true
  errorMessage.value = ''
  quantity.value = 1
  selectedImageIndex.value = 0
  mainImageFailed.value = false

  try {
    const result = await productsAPI.getProductDetail(route.params.id)
    product.value = result || {}
  } catch (error) {
    console.error('Failed to fetch product detail:', error)
    errorMessage.value = error.status === 404 ? labels.value.notFound : (error.message || labels.value.loadFailed)
  } finally {
    isLoading.value = false
  }
}

const increaseQuantity = () => {
  if (quantity.value < maxQuantity.value) quantity.value += 1
}

const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value -= 1
}

const addToCart = async () => {
  if (!isProductAvailable.value) return

  try {
    isAddingToCart.value = true
    await cartAPI.addToCart(displayProductId.value, quantity.value)
    alert(labels.value.addedToCart(quantity.value, product.value.name))
  } catch (error) {
    if (error.status === 401) {
      router.push('/login')
      return
    }
    alert(error.message || labels.value.loadFailed)
  } finally {
    isAddingToCart.value = false
  }
}

watch(() => route.params.id, fetchProductDetail)
watch(locale, fetchProductDetail)
onMounted(fetchProductDetail)
</script>
