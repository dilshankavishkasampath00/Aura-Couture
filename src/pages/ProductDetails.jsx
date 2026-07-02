import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import products from '../data/products.js'

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const product = useMemo(() => products.find((item) => item.id === id), [id])

  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || '')
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || '')

  if (!product) {
    return (
      <main className="min-h-screen px-4 py-10 text-center sm:px-6">
        <p className="text-sm text-slate-500">Product not found.</p>
        <button onClick={() => navigate('/shop')} className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#111]">Back to Shop</button>
      </main>
    )
  }

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.image,
      selectedColor,
      selectedSize,
      quantity: 1,
      price: product.price,
      savedLookImage: null
    })
    navigate('/cart')
  }

  const handleTryOn = () => {
    navigate(`/try-on/${product.id}`, { state: { selectedColor, selectedSize } })
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button onClick={() => navigate(-1)} className="text-sm text-slate-600 transition hover:text-slate-900">← Back</button>
          <Link to="/cart" className="text-sm text-slate-600 transition hover:text-slate-900">View Cart</Link>
        </div>

        <div className="rounded-[32px] bg-white p-6 shadow-sm shadow-slate-200/50">
          <img src={product.image} alt={product.name} className="w-full rounded-[28px] object-cover" />

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>
                <p className="mt-2 text-sm text-slate-500">Rs. {product.price.toLocaleString()}</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500">{product.category}</div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-3">Color</p>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${selectedColor === color ? 'border-primary bg-primary/10 text-slate-900' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-3">Size</p>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${selectedSize === size ? 'border-primary bg-primary/10 text-slate-900' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-3">Details</p>
              <p className="text-sm leading-7 text-slate-600">{product.description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={handleTryOn} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#111]">
                <span className="material-symbols-outlined">photo_camera</span>
                Try On With Camera
              </button>
              <button onClick={handleAddToCart} className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-6 py-4 text-sm font-semibold text-primary transition hover:bg-slate-100">
                Add to Cart
              </button>
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-500 max-w-xl">Virtual try-on is a visual preview. Actual fit may vary depending on body shape, garment material, and selected size.</p>
        </div>
      </div>
    </main>
  )
}
