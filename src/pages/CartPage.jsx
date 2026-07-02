import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, subtotal, delivery, total, removeFromCart, updateQuantity } = useCart()

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[32px] bg-white p-6 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Shopping bag</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your cart</h1>
          </div>
          <button onClick={() => navigate('/checkout')} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#111]">Checkout</button>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">No items in your cart yet.</div>
        ) : (
          <div className="mt-8 space-y-6">
            {items.map((item) => (
              <div key={item.key} className="flex flex-col gap-4 rounded-[28px] border border-slate-200 p-4 sm:flex-row sm:items-center">
                <img src={item.image} alt={item.name} className="h-28 w-28 rounded-3xl object-cover" />
                <div className="flex-1">
                  <h2 className="font-semibold text-slate-900">{item.name}</h2>
                  <p className="text-sm text-slate-500">{item.selectedColor} • {item.selectedSize}</p>
                  {item.savedLookImage && <img src={item.savedLookImage} alt="Saved look" className="mt-4 h-32 w-full rounded-3xl object-cover" />}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                    <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="text-slate-600">-</button>
                    <span className="font-semibold text-slate-900">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="text-slate-600">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.key)} className="text-sm font-semibold text-slate-500 hover:text-slate-900">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>Rs. {subtotal.toLocaleString()}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>Delivery</span>
            <span>Rs. {delivery.toLocaleString()}</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-lg font-semibold text-slate-900">
            <span>Total</span>
            <span>Rs. {total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </main>
  )
}
