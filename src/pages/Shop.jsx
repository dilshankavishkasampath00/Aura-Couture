import { useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'

export default function Shop({ products }) {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-background px-4 pb-10 pt-8 sm:px-6">
      <section className="mb-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-3">Shop the collection</p>
        <h1 className="text-4xl font-semibold text-slate-900">Virtual try-on products</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 max-w-2xl mx-auto">Choose a product and see how it looks over your live camera preview.</p>
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelect={() => navigate(`/product/${product.id}`)}
            onTryOn={() => navigate(`/try-on/${product.id}`)}
          />
        ))}
      </div>
    </main>
  )
}
