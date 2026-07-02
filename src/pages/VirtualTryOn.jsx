import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FlipHorizontal, Camera, Bookmark, Shirt, ShoppingCart, Images } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import CameraTryOn from '../components/CameraTryOn.jsx'
import CameraTryOn3D from '../components/CameraTryOn3D.jsx'
import products from '../data/products.js'

export default function VirtualTryOn() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { addToCart, saveLook } = useCart()
  const product = useMemo(() => products.find((entry) => entry.id === id), [id])

  const [selectedColor, setSelectedColor] = useState(location.state?.selectedColor || product?.colors?.[0] || '')
  const [selectedSize, setSelectedSize] = useState(location.state?.selectedSize || product?.sizes?.[0] || '')
  const [is3DMode, setIs3DMode] = useState(Boolean(product?.has3D))
  const [facingMode, setFacingMode] = useState('user')
  const [capturedImage, setCapturedImage] = useState(null)
  const [cameraStatus, setCameraStatus] = useState('loading')
  const [bodyDetected, setBodyDetected] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const cameraRef = useRef(null)

  useEffect(() => {
    if (cameraStatus === 'granted') {
      setSaveMessage('')
    }
  }, [cameraStatus])

  if (!product) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-center sm:px-6">
        <p className="text-sm text-slate-500">Product not found.</p>
        <button onClick={() => navigate('/shop')} className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">Back to Shop</button>
      </main>
    )
  }

  const sizeButtons = useMemo(() => product.sizes.map((size) => ({ label: size, value: size })), [product.sizes])

  const handleCapture = async () => {
    if (!cameraRef.current?.capturePhoto) return
    const image = await cameraRef.current.capturePhoto()
    if (image) {
      setCapturedImage(image)
      setSaveMessage('📸 Photo captured!')
    }
  }

  const handleSaveLook = () => {
    if (!capturedImage) return
    saveLook({
      productId: product.id,
      name: product.name,
      image: capturedImage,
      selectedColor,
      selectedSize
    })
    setSaveMessage('✅ Look saved!')
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
      savedLookImage: capturedImage
    })
    navigate('/cart')
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Camera / 3D View */}
      <div className="fixed inset-0">
        {is3DMode ? (
          <CameraTryOn3D
            ref={cameraRef}
            modelUrl={product.modelUrl}
            colorStr={selectedColor}
            facingMode={facingMode}
            onReady={() => setCameraStatus('granted')}
            onError={() => setCameraStatus('denied')}
            onPermissionChange={setCameraStatus}
            onPoseUpdate={setBodyDetected}
          />
        ) : (
          <CameraTryOn
            ref={cameraRef}
            overlayUrl={product.overlay}
            facingMode={facingMode}
            onReady={() => setCameraStatus('granted')}
            onError={() => setCameraStatus('denied')}
            onPermissionChange={setCameraStatus}
            onPoseUpdate={setBodyDetected}
          />
        )}
      </div>

      {/* Top Bar */}
      <div className="fixed inset-x-0 top-0 z-20 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-2xl bg-black/40 px-3 py-2 backdrop-blur-xl border border-white/10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-2 overflow-hidden">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 truncate max-w-[100px]">{selectedColor}</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80">{selectedSize}</span>
          </div>

          <div className="flex items-center gap-2">
            {product.has3D && (
              <button
                onClick={() => setIs3DMode(!is3DMode)}
                className={`rounded-full border px-3 py-2 text-xs font-bold transition ${is3DMode ? 'border-blue-400 bg-blue-500 text-white' : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20'}`}
              >
                {is3DMode ? '3D ✦' : '2D'}
              </button>
            )}
            <button
              onClick={() => setFacingMode((mode) => (mode === 'user' ? 'environment' : 'user'))}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <FlipHorizontal size={15} />
              <span className="hidden sm:inline">Flip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Control Panel */}
      <div className="fixed inset-x-0 bottom-0 z-20 px-3 pb-5 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-black/75 p-4 backdrop-blur-2xl shadow-2xl">

          {/* Color & Size Selectors */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${selectedColor === color ? 'border-white bg-white text-black' : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Size</p>
              <div className="flex flex-wrap gap-1.5">
                {sizeButtons.map((button) => (
                  <button
                    key={button.value}
                    onClick={() => setSelectedSize(button.value)}
                    className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${selectedSize === button.value ? 'border-white bg-white text-black' : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20'}`}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={handleCapture}
              className="inline-flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/20 bg-white/10 py-3 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95"
            >
              <Camera size={18} />
              Capture
            </button>
            <button
              onClick={handleSaveLook}
              disabled={!capturedImage}
              className="inline-flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/20 bg-white/10 py-3 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
            >
              <Bookmark size={18} />
              Save Look
            </button>
            <button
              onClick={() => navigate('/shop')}
              className="inline-flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/20 bg-white/10 py-3 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95"
            >
              <Shirt size={18} />
              Change
            </button>
          </div>

          {/* Captured Image Preview */}
          {capturedImage && (
            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3">
              <img src={capturedImage} alt="Saved preview" className="h-12 w-12 rounded-xl object-cover" />
              <div>
                <p className="text-sm font-semibold text-white">Saved preview</p>
                <p className="text-xs text-white/60">Captured look ready to save.</p>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="mb-3 flex items-center justify-between text-xs text-white/60">
            <span>
              {cameraStatus === 'denied' ? '⚠️ Camera permission denied' :
               cameraStatus === 'loading' ? '⏳ Starting camera...' :
               bodyDetected ? '🟢 Body detected – hold still' :
               '👤 Align your body inside the frame'}
            </span>
            <span className="rounded-full bg-white/10 px-2 py-1">{selectedColor} / {selectedSize}</span>
          </div>

          {/* Disclaimer */}
          <p className="mb-3 text-[10px] text-white/40 leading-relaxed">
            Virtual try-on is a visual preview. Actual fit may vary depending on body shape, garment material, and selected size.
          </p>

          {/* Add to Cart & Saved Looks */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddToCart}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 active:scale-95"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
            <Link
              to="/saved-looks"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
            >
              <Images size={16} />
              Saved Looks
            </Link>
          </div>

          {saveMessage && <p className="mt-2 text-center text-sm font-medium text-emerald-400">{saveMessage}</p>}
        </div>
      </div>
    </main>
  )
}
