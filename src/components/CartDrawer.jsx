import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

export default function CartDrawer() {
  const { drawerOpen, setDrawerOpen, items, removeFromCart, updateQuantity, subtotal, delivery, total } = useCart()
  const navigate = useNavigate()

  if (!drawerOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">My Cart</p>
            <h2 className="text-xl font-semibold text-slate-900">Ready to checkout</h2>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="divide-y divide-slate-200 overflow-y-auto px-5 py-4" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {items.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">Your cart is empty. Add a look or try on a product first.</div>
          ) : (
            items.map((item) => (
              <div key={item.key} className="flex gap-4 py-4">
                <img src={item.image} alt={item.name} className="h-20 w-20 rounded-3xl object-cover" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{item.selectedColor} • {item.selectedSize}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.key)} className="text-slate-400 transition hover:text-slate-700">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="h-9 w-9 rounded-full border border-slate-200 text-slate-700">-</button>
                    <span className="text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="h-9 w-9 rounded-full border border-slate-200 text-slate-700">+</button>
                    <span className="ml-auto text-sm font-semibold text-slate-900">Rs. {item.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>Rs. {subtotal.toLocaleString()}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
            <span>Delivery</span>
            <span>Rs. {delivery.toLocaleString()}</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>Rs. {total.toLocaleString()}</span>
          </div>
          <button onClick={() => { setDrawerOpen(false); navigate('/checkout') }} className="mt-5 w-full rounded-full bg-slate-900 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-800">
            Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  )
}
