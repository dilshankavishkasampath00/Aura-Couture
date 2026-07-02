import React, { createContext, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

const makeKey = (item) => `${item.productId}-${item.selectedColor}-${item.selectedSize}`

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [savedLooks, setSavedLooks] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )
  const delivery = items.length > 0 ? 250 : 0
  const total = subtotal + delivery
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const addToCart = (item) => {
    setItems((current) => {
      const key = item.key || makeKey(item)
      const existingIndex = current.findIndex((entry) => entry.key === key)
      if (existingIndex >= 0) {
        const updated = [...current]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
          savedLookImage: item.savedLookImage || updated[existingIndex].savedLookImage
        }
        return updated
      }
      return [...current, { ...item, key }]
    })
  }

  const removeFromCart = (key) => {
    setItems((current) => current.filter((item) => item.key !== key))
  }

  const updateQuantity = (key, value) => {
    setItems((current) =>
      current
        .map((item) => (item.key === key ? { ...item, quantity: Math.max(1, value) } : item))
        .filter((item) => item.quantity > 0)
    )
  }

  const saveLook = (look) => {
    setSavedLooks((current) => [{ ...look, id: `${look.productId}-${Date.now()}` }, ...current])
  }

  const toggleDrawer = () => setDrawerOpen((open) => !open)

  const value = useMemo(
    () => ({
      items,
      savedLooks,
      drawerOpen,
      setDrawerOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      saveLook,
      toggleDrawer,
      subtotal,
      delivery,
      total,
      itemCount
    }),
    [items, savedLooks, drawerOpen, subtotal, delivery, total, itemCount]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
