import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
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
        <button onClick={() => navigate('/shop')} className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#111]">Back to Shop</button>
      </main>
    )
  }

  const sizeButtons = useMemo(() => product.sizes.map((size) => ({ label: size, value: size })), [product.sizes])

  const handleCapture = async () => {
    if (!cameraRef.current?.capturePhoto) return
    const image = await cameraRef.current.capturePhoto()
    if (image) {
      setCapturedImage(image)
      setSaveMessage('Photo captured')
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
    setSaveMessage('Saved look added')
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

      <div className="fixed inset-x-0 top-0 z-20 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-full bg-black/30 px-3 py-3 backdrop-blur-xl shadow-lg shadow-black/20">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/80">{selectedColor}</span>
            <span className="rounded-full bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/80">{selectedSize}</span>
          </div>
          <div className="flex items-center gap-2">
            {product.has3D && (
              <button onClick={() => setIs3DMode(!is3DMode)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${is3DMode ? 'border-primary bg-primary text-white' : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}`}>
                {is3DMode ? '3D' : '2D'}
              </button>
            )}
            <button onClick={() => setFacingMode((mode) => (mode === 'user' ? 'environment' : 'user'))} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 hidden sm:inline-flex">
              <span className="material-symbols-outlined text-[18px]">flip_camera_android</span>
              Switch
            </button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-6 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-white/15 bg-black/70 p-4 backdrop-blur-2xl shadow-2xl shadow-black/30">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70 mb-3">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${selectedColor === color ? 'border-primary bg-primary/15 text-white' : 'border-white/20 bg-white/10 text-white/80'}`}>
                    {color}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70 mb-3">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizeButtons.map((button) => (
                  <button
                    key={button.value}
                    onClick={() => setSelectedSize(button.value)}
                    className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${selectedSize === button.value ? 'border-primary bg-primary/15 text-white' : 'border-white/20 bg-white/10 text-white/80'}`}>
                    {button.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button onClick={handleCapture} className="rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              <span className="material-symbols-outlined">camera_alt</span>
              Capture
            </button>
            <button onClick={handleSaveLook} disabled={!capturedImage} className="rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50">
              <span className="material-symbols-outlined">save</span>
              Save Look
            </button>
            <button onClick={() => navigate('/shop')} className="rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              <span className="material-symbols-outlined">checkroom</span>
              Change Dress
            </button>
          </div>

          {capturedImage && (
            <div className="mt-4 flex items-center gap-3 rounded-[28px] border border-white/10 bg-white/10 p-3">
              <img src={capturedImage} alt="Saved preview" className="h-16 w-16 rounded-3xl object-cover" />
              <div>
                <p className="text-sm font-semibold text-white">Saved preview</p>
                <p className="text-xs text-white/70">Captured look will be saved to Saved Looks.</p>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-[28px] border border-white/10 bg-white/10 p-4 text-sm text-white/70">
            Virtual try-on is a visual preview. Actual fit may vary depending on body shape, garment material, and selected size.
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
            <span>{cameraStatus === 'denied' ? 'Camera permission denied' : bodyDetected ? 'Body detected. Hold still.' : 'Align your body inside the frame.'}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">{selectedColor} / {selectedSize}</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button onClick={handleAddToCart} className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#111]">Add to Cart</button>
            <Link to="/saved-looks" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              <span className="material-symbols-outlined">photo_library</span>
              Saved Looks
            </Link>
          </div>

          {saveMessage && <p className="mt-3 text-sm text-emerald-300">{saveMessage}</p>}
        </div>
      </div>
    </main>
  )
}
