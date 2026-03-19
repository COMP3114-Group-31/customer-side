import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

function deepMerge(target, source) {
  const output = { ...target }
  Object.keys(source).forEach((key) => {
    if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof output[key] === 'object' &&
      output[key] !== null &&
      !Array.isArray(output[key])
    ) {
      output[key] = deepMerge(output[key], source[key])
    } else {
      output[key] = source[key]
    }
  })
  return output
}

const extraMessages = {
  en: {
    ui: {
      loadingCart: 'Loading cart...',
      emptyCart: 'Your cart is empty',
      clearCart: 'Clear Cart',
      processing: 'Processing...',
      viewProductDetail: 'View product details',
      productIdLabel: 'Product ID',
      subtotal: 'Subtotal',
      removeCartItemConfirm: 'Remove this item from cart?',
      clearCartConfirm: 'Clear your cart?',
      updateCartFailed: 'Failed to update quantity.',
      removeCartFailed: 'Failed to remove item.',
      clearCartFailed: 'Failed to clear cart.',
      orderCreated: 'Order created successfully.',
      checkoutFailed: 'Checkout failed. Please try again.',
      orderHistorySubtitle: 'View your order history',
      loadingOrders: 'Loading orders...',
      loginToViewOrders: 'Please login to view your orders.',
      loadOrdersFailed: 'Failed to load orders.',
      startShopping: 'Start Shopping',
      orderLabel: 'Order',
      purchaseDate: 'Purchase Date',
      totalLabel: 'Total',
      viewDetails: 'View Details',
      hideDetails: 'Hide Details',
      cancelling: 'Cancelling...',
      cancelOrder: 'Cancel Order',
      loadingOrderDetails: 'Loading order details...',
      loadOrderDetailFailed: 'Failed to load order details.',
      shippingAddress: 'Shipping Address',
      orderItems: 'Order Items',
      noOrderItems: 'No order items available.',
      quantityLabel: 'Quantity',
      unitPrice: 'Unit Price',
      statusLabel: 'Status',
      previous: 'Previous',
      next: 'Next',
      pageXofY: 'Page {current} of {total}',
      cancelOrderConfirm: 'Cancel order #{id}?',
      cancelOrderSuccess: 'Order cancelled successfully.',
      cancelOrderFailed: 'Failed to cancel order.',
      cancelNotAvailable: 'This order can no longer be cancelled.',
      completed: 'Completed',
      onHold: 'On Hold',
      productLabel: 'Product'
    }
  },
  'zh-CN': {
    ui: {
      loadingCart: '正在加载购物车...',
      emptyCart: '购物车还是空的',
      clearCart: '清空购物车',
      processing: '处理中...',
      viewProductDetail: '查看商品详情',
      productIdLabel: '商品编号',
      subtotal: '小计',
      removeCartItemConfirm: '确定要从购物车中删除这个商品吗？',
      clearCartConfirm: '确定要清空购物车吗？',
      updateCartFailed: '更新数量失败。',
      removeCartFailed: '删除商品失败。',
      clearCartFailed: '清空购物车失败。',
      orderCreated: '订单创建成功。',
      checkoutFailed: '结算失败，请稍后重试。',
      orderHistorySubtitle: '查看你的历史订单',
      loadingOrders: '正在加载订单...',
      loginToViewOrders: '请先登录后再查看订单。',
      loadOrdersFailed: '加载订单失败。',
      startShopping: '去购物',
      orderLabel: '订单',
      purchaseDate: '下单日期',
      totalLabel: '总计',
      viewDetails: '查看详情',
      hideDetails: '收起详情',
      cancelling: '取消中...',
      cancelOrder: '取消订单',
      loadingOrderDetails: '正在加载订单详情...',
      loadOrderDetailFailed: '加载订单详情失败。',
      shippingAddress: '收货地址',
      orderItems: '订单商品',
      noOrderItems: '暂时没有订单明细。',
      quantityLabel: '数量',
      unitPrice: '单价',
      statusLabel: '状态',
      previous: '上一页',
      next: '下一页',
      pageXofY: '第 {current} / {total} 页',
      cancelOrderConfirm: '确定要取消订单 #{id} 吗？',
      cancelOrderSuccess: '订单取消成功。',
      cancelOrderFailed: '取消订单失败。',
      cancelNotAvailable: '该订单当前状态不可取消。',
      completed: '已完成',
      onHold: '挂起中',
      productLabel: '商品'
    }
  }
}

const savedLocale =
  (typeof localStorage !== 'undefined' &&
    (localStorage.getItem('locale') || localStorage.getItem('language'))) ||
  'en'

const messages = {
  en: deepMerge(en, extraMessages.en),
  'zh-CN': deepMerge(zhCN, extraMessages['zh-CN'])
}

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages,
})

if (typeof document !== 'undefined') {
  document.documentElement.lang = savedLocale
}

export default i18n
