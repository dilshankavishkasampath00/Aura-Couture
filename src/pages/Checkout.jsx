import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

export default function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, delivery, total } = useCart()

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[32px] bg-white p-6 shadow-sm shadow-slate-200/50">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Checkout</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Complete your order</h1>
          </div>
          <button onClick={() => navigate('/shop')} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#111]">Continue Shopping</button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">Your cart is empty. Add a product before checking out.</div>
        ) : (
          <div className="space-y-5">
            {items.map((item) => (
              <div key={item.key} className="flex flex-col gap-4 rounded-[28px] border border-slate-200 p-4 sm:flex-row sm:items-center">
                <img src={item.image} alt={item.name} className="h-24 w-24 rounded-3xl object-cover" />
                <div className="flex-1">
                  <h2 className="font-semibold text-slate-900">{item.name}</h2>
                  <p className="text-sm text-slate-500">{item.selectedColor} • {item.selectedSize}</p>
                  {item.savedLookImage && <img src={item.savedLookImage} alt="Saved look" className="mt-3 h-28 w-full max-w-sm rounded-3xl object-cover" />}
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Qty {item.quantity}</p>
                  <p className="mt-2 font-semibold text-slate-900">Rs. {(item.price * item.quantity).toLocaleString()}</p>
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

        <button onClick={() => navigate('/')} className="mt-6 w-full rounded-full bg-primary px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#111]">Place Order</button>
      </div>
    </main>
  )
}
