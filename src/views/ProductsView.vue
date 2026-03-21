<template>
  <div class="container mx-auto px-4 py-8">
    <div class="py-4">
      <nav class="flex text-sm text-gray-600">
        <router-link to="/" class="hover:text-primary">{{ labels.home }}</router-link>
        <span class="mx-2">/</span>
        <span class="text-gray-900">{{ labels.allProducts }}</span>
      </nav>
    </div>

    <div class="flex flex-col lg:flex-row gap-8">
      <aside class="lg:w-1/4">
        <div class="bg-white rounded-xl shadow-lg p-6 sticky top-6">
          <div class="mb-6">
            <h3 class="font-semibold text-gray-900 mb-3">{{ labels.search }}</h3>
            <div class="relative">
              <input
                v-model.trim="searchQuery"
                type="text"
                :placeholder="labels.searchPlaceholder"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              >
              <i class="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>

          <div class="mb-6 opacity-60">
            <h3 class="font-semibold text-gray-900 mb-3">{{ labels.categories }}</h3>
            <div class="space-y-2">
              <label v-for="category in mockCategories" :key="category.id" class="flex items-center cursor-not-allowed">
                <input type="checkbox" disabled class="h-4 w-4 border-gray-300 rounded">
                <span class="ml-2 text-sm text-gray-700">{{ category.name }}</span>
                <span class="ml-auto text-xs text-gray-500">({{ category.count }})</span>
              </label>
            </div>
          </div>

          <div class="mb-6 opacity-60">
            <h3 class="font-semibold text-gray-900 mb-3">{{ labels.priceRange }}</h3>
            <div class="grid grid-cols-2 gap-3">
              <input disabled type="number" :placeholder="labels.minPrice" class="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed">
              <input disabled type="number" :placeholder="labels.maxPrice" class="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed">
            </div>
          </div>

          <div class="opacity-60">
            <h3 class="font-semibold text-gray-900 mb-3">{{ labels.sort }}</h3>
            <select disabled class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed">
              <option>{{ labels.defaultSort }}</option>
              <option>{{ labels.priceLowToHigh }}</option>
              <option>{{ labels.priceHighToLow }}</option>
              <option>{{ labels.sortByName }}</option>
            </select>
          </div>
        </div>
      </aside>

      <main class="lg:w-3/4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">{{ labels.allProducts }}</h1>
            <p class="text-gray-600 mt-1">{{ labels.totalResults(totalItems) }}</p>
          </div>
        </div>

        <div v-if="isLoading" class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-2xl text-primary"></i>
          <p class="mt-2 text-gray-600">{{ labels.loading }}</p>
        </div>

        <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {{ errorMessage }}
        </div>

        <div v-else-if="products.length === 0" class="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
          {{ labels.noProducts }}
        </div>

        <div v-else>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <article
              v-for="product in sortedProducts"
              :key="getProductId(product)"
              class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <button type="button" class="w-full text-left" @click="openProduct(product)">
                <div class="w-full h-56 bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    v-if="getProductImage(product)"
                    :src="getProductImage(product)"
                    :alt="product.name"
                    class="w-full h-full object-cover"
                  >
                  <i v-else class="fas fa-image text-4xl text-gray-400"></i>
                </div>

                <div class="p-5">
                  <h2 class="text-xl font-bold text-gray-900 mb-2 truncate">{{ product.name }}</h2>
                  <p v-if="product.description" class="text-sm text-gray-600 mb-4 line-clamp-2">{{ product.description }}</p>

                  <div class="flex items-center justify-between">
                    <span class="text-2xl font-bold text-primary">{{ formatPrice(product.price) }}</span>
                    <span class="text-sm text-gray-500">{{ labels.categoryLabel }}: {{ formatCategory(product.category) }}</span>
                  </div>
                </div>
              </button>

              <div class="px-5 pb-5">
                <button
                  type="button"
                  class="w-full bg-primary hover:bg-orange-600 text-white py-2.5 rounded-button text-sm"
                  @click="addToCart(product)"
                >
                  {{ labels.addToCart }}
                </button>
              </div>
            </article>
          </div>

          <div v-if="totalPages > 1" class="mt-8 flex justify-center items-center gap-3 flex-wrap">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              <i class="fas fa-chevron-left mr-1"></i>{{ labels.previous }}
            </button>

            <span class="text-gray-700">{{ labels.page(currentPage, totalPages) }}</span>

            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              {{ labels.next }}<i class="fas fa-chevron-right ml-1"></i>
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { cartAPI, productsAPI } from '../api'

const { locale } = useI18n()
const router = useRouter()
const route = useRoute()
const products = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 9
const totalItems = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
const isSyncingFromRoute = ref(false)

const isZh = computed(() => String(locale.value || '').toLowerCase().startsWith('zh'))
const labels = computed(() => isZh.value ? {
  home: '首页',
  allProducts: '全部商品',
  search: '搜索',
  searchPlaceholder: '搜索商品...',
  categories: '分类',
  priceRange: '价格区间',
  minPrice: '最低价',
  maxPrice: '最高价',
  sort: '排序',
  defaultSort: '默认排序',
  priceLowToHigh: '价格从低到高',
  priceHighToLow: '价格从高到低',
  sortByName: '按名称',
  totalResults: (n) => `共 ${n} 件商品`,
  loading: '正在加载商品...',
  noProducts: '暂无商品',
  categoryLabel: '分类',
  addToCart: '加入购物车',
  previous: '上一页',
  next: '下一页',
  page: (p, t) => `第 ${p} / ${t} 页`
} : {
  home: 'Home',
  allProducts: 'All Products',
  search: 'Search',
  searchPlaceholder: 'Search products...',
  categories: 'Categories',
  priceRange: 'Price Range',
  minPrice: 'Min',
  maxPrice: 'Max',
  sort: 'Sort',
  defaultSort: 'Default',
  priceLowToHigh: 'Price: Low to High',
  priceHighToLow: 'Price: High to Low',
  sortByName: 'Name',
  totalResults: (n) => `${n} products`,
  loading: 'Loading products...',
  noProducts: 'No products available.',
  categoryLabel: 'Category',
  addToCart: 'Add to Cart',
  previous: 'Previous',
  next: 'Next',
  page: (p, t) => `Page ${p} of ${t}`
})

const mockCategories = computed(() => isZh.value ? [
  { id: 1, name: '手机', count: 12 },
  { id: 2, name: '平板', count: 6 },
  { id: 3, name: '笔记本', count: 9 },
  { id: 4, name: '配件', count: 14 }
] : [
  { id: 1, name: 'Phone', count: 12 },
  { id: 2, name: 'Tablet', count: 6 },
  { id: 3, name: 'Laptop', count: 9 },
  { id: 4, name: 'Accessory', count: 14 }
])

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))
const sortedProducts = computed(() => [...products.value])

const getProductId = (product) => product?.id ?? product?.product_id ?? product?._id
const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`
const formatCategory = (value) => {
  const key = String(value || '').toLowerCase()
  const zhMap = { phone: '手机', tablet: '平板', laptop: '笔记本', accessory: '配件', other: '其他', audio: '音频', wearable: '穿戴设备', wearables: '穿戴设备' }
  const enMap = { phone: 'Phone', tablet: 'Tablet', laptop: 'Laptop', accessory: 'Accessory', other: 'Other', audio: 'Audio', wearable: 'Wearable', wearables: 'Wearables' }
  return (isZh.value ? zhMap[key] : enMap[key]) || value || '-'
}

const getProductImage = (product) => {
  if (product?.thumbnail_url) return productsAPI.resolveAssetUrl(product.thumbnail_url)
  if (product?.thumbnail) return productsAPI.resolveAssetUrl(product.thumbnail)
  if (product?.thumbnail_filename) return productsAPI.getProductThumbnailUrl(product.thumbnail_filename)

  const firstImage = Array.isArray(product?.images) ? product.images[0] : null
  if (!firstImage) return ''

  if (typeof firstImage === 'string') {
    return productsAPI.getProductImageUrl(getProductId(product), firstImage)
  }

  return productsAPI.resolveAssetUrl(firstImage.url || firstImage.image_url || firstImage.src || '')
}

const fetchProducts = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await productsAPI.getProducts({
      page: currentPage.value,
      pageSize,
      search: searchQuery.value
    })

    products.value = result?.products || []
    totalItems.value = result?.pagination?.total_items || products.value.length
  } catch (error) {
    console.error('Failed to fetch products:', error)
    errorMessage.value = error.message || (isZh.value ? '加载商品失败。' : 'Failed to load products.')
    products.value = []
    totalItems.value = 0
  } finally {
    isLoading.value = false
  }
}

const openProduct = (product) => {
  const productId = getProductId(product)
  if (!productId) return
  router.push(`/product/${productId}`)
}

const addToCart = async (product) => {
  try {
    await cartAPI.addToCart(getProductId(product), 1)
    alert(isZh.value ? `已将 ${product.name} 加入购物车。` : `Added ${product.name} to cart.`)
  } catch (error) {
    if (error.status === 401) {
      router.push('/login')
      return
    }
    alert(error.message || (isZh.value ? '加入购物车失败。' : 'Failed to add to cart.'))
  }
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

let searchTimer = null
watch(searchQuery, () => {
  if (isSyncingFromRoute.value) return

  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (currentPage.value !== 1) {
      currentPage.value = 1
      return
    }
    fetchProducts()
  }, 350)
})

watch(currentPage, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  fetchProducts()
})

watch(
  () => route.query.search,
  async (newValue) => {
    const nextValue = String(newValue || '')
    if (nextValue === searchQuery.value) return

    isSyncingFromRoute.value = true
    searchQuery.value = nextValue

    if (currentPage.value !== 1) {
      currentPage.value = 1
    } else {
      await fetchProducts()
    }

    isSyncingFromRoute.value = false
  }
)

watch(locale, async () => {
  await fetchProducts()
})

onMounted(() => {
  searchQuery.value = String(route.query.search || '')
  fetchProducts()
})
</script>
