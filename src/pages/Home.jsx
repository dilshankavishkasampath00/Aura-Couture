import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'

export default function Home({ products }) {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <section className="mb-10 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-3">Virtual Try-On</p>
        <h1 className="text-4xl font-semibold leading-tight text-slate-900">Wear it before you buy it.</h1>
        <p className="mt-4 text-base leading-7 text-slate-600 max-w-2xl mx-auto">Try dresses live through your phone camera with AI pose guidance and transparent overlay preview.</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button onClick={() => navigate('/shop')} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:bg-[#111]">
            Try on now
          </button>
          <Link to="/saved-looks" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
            Saved Looks
          </Link>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex flex-wrap items-center gap-3 justify-center text-sm text-slate-500">
          <span>Women</span>
          <span>Men</span>
          <span>Kids</span>
          <span>New Arrivals</span>
        </div>
      </section>

      <section>
        <div className="grid gap-5 sm:grid-cols-2">
          {products.slice(0, 3).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  )
}
