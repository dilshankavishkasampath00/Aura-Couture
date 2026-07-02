import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProductCard({ product, onSelect, onTryOn }) {
  const navigate = useNavigate()

  const showDetails = () => {
    if (onSelect) {
      onSelect(product)
      return
    }
    navigate(`/product/${product.id}`)
  }

  const showTryOn = () => {
    if (onTryOn) {
      onTryOn(product)
      return
    }
    navigate(`/try-on/${product.id}`)
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
      <button onClick={showDetails} className="group block overflow-hidden rounded-3xl mb-4">
        <img src={product.image} alt={product.name} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" />
      </button>
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">{product.category}</p>
        <h2 className="text-lg font-semibold text-slate-900">{product.name}</h2>
        <p className="mt-2 text-sm text-slate-500">Rs. {product.price.toLocaleString()}</p>
      </div>
      <div className="flex flex-col gap-3">
        <button onClick={showTryOn} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#111]">
          <span className="material-symbols-outlined">view_in_ar</span>
          Try On
        </button>
        <button onClick={showDetails} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          View details
        </button>
      </div>
    </div>
  )
}
