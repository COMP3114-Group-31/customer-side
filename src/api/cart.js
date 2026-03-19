import client from './client.js'

function wrapError(prefix, error, fallbackMessage) {
  const wrapped = new Error(`${prefix}: ${error.data?.error || error.message || fallbackMessage}`)
  wrapped.status = error.status
  wrapped.data = error.data
  throw wrapped
}

function matchesProductId(item, productId) {
  return String(item?.product_id ?? item?.id ?? '') === String(productId)
}

export const cartAPI = {
  async addToCart(productId, quantity = 1) {
    try {
      return await client.request('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity })
      })
    } catch (error) {
      if (error.status === 409) {
        try {
          const cart = await client.request('/cart')
          const existingItem = (cart?.items || []).find((item) => matchesProductId(item, productId))

          if (existingItem) {
            const nextQuantity = Number(existingItem.quantity || 0) + Number(quantity || 0)
            return await client.request(`/cart/items/${productId}`, {
              method: 'PATCH',
              body: JSON.stringify({ quantity: nextQuantity })
            })
          }
        } catch (fallbackError) {
          wrapError('添加到购物车失败', fallbackError, 'Failed to add to cart')
        }
      }

      wrapError('添加到购物车失败', error, 'Failed to add to cart')
    }
  },

  async getCart() {
    try {
      return await client.request('/cart')
    } catch (error) {
      wrapError('获取购物车失败', error, 'Failed to get cart')
    }
  },

  async updateCartItem(productId, quantity) {
    try {
      return await client.request(`/cart/items/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity })
      })
    } catch (error) {
      wrapError('更新购物车失败', error, 'Failed to update cart item')
    }
  },

  async removeFromCart(productId) {
    try {
      return await client.request(`/cart/items/${productId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      if (error.status === 404) {
        try {
          const cart = await client.request('/cart')
          const items = cart?.items || []
          const existingItem = items.find((item) => matchesProductId(item, productId))

          if (!existingItem) {
            return { message: 'Item already removed' }
          }

          if (items.length === 1) {
            return await client.request('/cart', { method: 'DELETE' })
          }
        } catch (fallbackError) {
          wrapError('删除购物车商品失败', fallbackError, 'Failed to remove cart item')
        }
      }

      wrapError('删除购物车商品失败', error, 'Failed to remove cart item')
    }
  },

  async clearCart() {
    try {
      return await client.request('/cart', {
        method: 'DELETE'
      })
    } catch (error) {
      wrapError('清空购物车失败', error, 'Failed to clear cart')
    }
  }
}
