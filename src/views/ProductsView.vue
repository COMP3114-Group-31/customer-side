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

          <div class="mb-6">
            <h3 class="font-semibold text-gray-900 mb-3">{{ labels.categories }}</h3>
            <div class="space-y-2">
              <label
                v-for="category in categoryOptions"
                :key="category.key"
                class="flex items-center cursor-pointer"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4 border-gray-300 rounded"
                  :checked="selectedCategory === category.key"
                  @change="toggleCategory(category.key)"
                >
                <span class="ml-2 text-sm text-gray-700">{{ category.name }}</span>
              </label>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="font-semibold text-gray-900 mb-3">{{ labels.priceRange }}</h3>
            <div class="grid grid-cols-2 gap-3">
              <input
                v-model="minPrice"
                type="number"
                min="0"
                max="99999"
                step="1"
                :placeholder="labels.minPrice"
                class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                @input="minPrice = normalizePriceInput(minPrice)"
              >
              <input
                v-model="maxPrice"
                type="number"
                min="0"
                max="99999"
                step="1"
                :placeholder="labels.maxPrice"
                class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                @input="maxPrice = normalizePriceInput(maxPrice)"
              >
            </div>
          </div>

          <div>
            <h3 class="font-semibold text-gray-900 mb-3">{{ labels.sort }}</h3>
            <select
              v-model="sortOption"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-primary"
            >
              <option value="">{{ labels.defaultSort }}</option>
              <option value="price_asc">{{ labels.priceLowToHigh }}</option>
              <option value="price_desc">{{ labels.priceHighToLow }}</option>
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

          <button
            v-if="hasActiveFilters"
            type="button"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            @click="clearFilters"
          >
            {{ labels.clearFilters }}
          </button>
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
              v-for="product in products"
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
const selectedCategory = ref('')
const minPrice = ref('')
const maxPrice = ref('')
const sortOption = ref('')
const currentPage = ref(1)
const pageSize = 9
const totalItems = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')

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
  totalResults: (n) => `共 ${n} 件商品`,
  loading: '正在加载商品...',
  noProducts: '暂无商品',
  categoryLabel: '分类',
  addToCart: '加入购物车',
  previous: '上一页',
  next: '下一页',
  clearFilters: '清空筛选',
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
  totalResults: (n) => `${n} products`,
  loading: 'Loading products...',
  noProducts: 'No products available.',
  categoryLabel: 'Category',
  addToCart: 'Add to Cart',
  previous: 'Previous',
  next: 'Next',
  clearFilters: 'Clear Filters',
  page: (p, t) => `Page ${p} of ${t}`
})

const categoryOptions = computed(() => isZh.value ? [
  { key: 'phone', name: '手机' },
  { key: 'tablet', name: '平板' },
  { key: 'laptop', name: '笔记本' },
  { key: 'accessory', name: '配件' },
  { key: 'other', name: '其他' }
] : [
  { key: 'phone', name: 'Phone' },
  { key: 'tablet', name: 'Tablet' },
  { key: 'laptop', name: 'Laptop' },
  { key: 'accessory', name: 'Accessory' },
  { key: 'other', name: 'Other' }
])

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))
const hasActiveFilters = computed(() =>
  !!searchQuery.value || !!selectedCategory.value || String(minPrice.value) !== '' || String(maxPrice.value) !== '' || !!sortOption.value
)

const getProductId = (product) => product?.id ?? product?.product_id ?? product?._id
const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`

const formatCategory = (value) => {
  const key = String(value || '').toLowerCase()
  const zhMap = { phone: '手机', tablet: '平板', laptop: '笔记本', accessory: '配件', other: '其他' }
  const enMap = { phone: 'Phone', tablet: 'Tablet', laptop: 'Laptop', accessory: 'Accessory', other: 'Other' }
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

const normalizePriceInput = (value) => {
  if (value === '' || value === null || value === undefined) return ''
  const num = Number(value)
  if (Number.isNaN(num)) return ''
  if (num < 0) return 0
  if (num > 99999) return 99999
  return Math.floor(num)
}

const getSortParams = () => {
  if (sortOption.value === 'price_asc') return { sortBy: 'price', sortDir: 'asc' }
  if (sortOption.value === 'price_desc') return { sortBy: 'price', sortDir: 'desc' }
  return { sortBy: '', sortDir: '' }
}

const fetchProducts = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { sortBy, sortDir } = getSortParams()
    const normalizedMin = normalizePriceInput(minPrice.value)
    const normalizedMax = normalizePriceInput(maxPrice.value)

    minPrice.value = normalizedMin
    maxPrice.value = normalizedMax

    const finalMin = normalizedMin === '' ? '' : Number(normalizedMin)
    const finalMax = normalizedMax === '' ? '' : Number(normalizedMax)

    if (finalMin !== '' && finalMax !== '' && finalMin > finalMax) {
      errorMessage.value = isZh.value ? '最低价不能大于最高价。' : 'Min price cannot be greater than max price.'
      products.value = []
      totalItems.value = 0
      isLoading.value = false
      return
    }

    const result = await productsAPI.getProducts({
      page: currentPage.value,
      pageSize,
      search: searchQuery.value,
      category: selectedCategory.value,
      minPrice: finalMin,
      maxPrice: finalMax,
      sortBy,
      sortDir
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
  fetchProducts()
}

const toggleCategory = (key) => {
  selectedCategory.value = selectedCategory.value === key ? '' : key
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  minPrice.value = ''
  maxPrice.value = ''
  sortOption.value = ''
  currentPage.value = 1
  syncRouteFromState()
}

const syncStateFromRoute = () => {
  searchQuery.value = String(route.query.search || '')
  selectedCategory.value = String(route.query.category || '')
}

const syncRouteFromState = () => {
  const query = {}
  if (searchQuery.value) query.search = searchQuery.value
  if (selectedCategory.value) query.category = selectedCategory.value
  router.replace({ path: '/products', query })
}

let searchTimer = null
watch(searchQuery, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    syncRouteFromState()
    fetchProducts()
  }, 350)
})

watch(selectedCategory, () => {
  currentPage.value = 1
  syncRouteFromState()
  fetchProducts()
})

watch([minPrice, maxPrice, sortOption], () => {
  currentPage.value = 1
  fetchProducts()
})

watch(
  () => route.query,
  (query) => {
    const nextSearch = String(query.search || '')
    const nextCategory = String(query.category || '')
    if (nextSearch !== searchQuery.value) searchQuery.value = nextSearch
    if (nextCategory !== selectedCategory.value) selectedCategory.value = nextCategory
  }
)

watch(locale, async () => {
  await fetchProducts()
})

onMounted(async () => {
  syncStateFromRoute()
  await fetchProducts()
})
</script>
