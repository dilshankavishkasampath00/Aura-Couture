import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Upload, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  RotateCcw, Save, ShoppingCart, Camera, ZoomIn, ZoomOut,
  ImageOff, Info
} from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import products, { COLOR_FILTERS } from '../data/products.js'

const DEFAULT_OVERLAY = { x: 50, y: 20, width: 52, rotate: 0 }

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({ onPhoto }) {
  const inputRef = useRef(null)

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => onPhoto(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  const tips = [
    { ok: true,  text: 'Full body visible in frame' },
    { ok: true,  text: 'Face forward, good lighting' },
    { ok: true,  text: 'Light / plain background' },
    { ok: false, text: 'Side / back view' },
    { ok: false, text: 'Dark or blurry image' },
    { ok: false, text: 'Cropped or zoomed in' },
  ]

  return (
    <div className="flex flex-col items-center gap-6 px-2 py-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="group relative w-full cursor-pointer rounded-3xl border-2 border-dashed border-white/20 bg-white/5 p-10 text-center transition hover:border-white/40 hover:bg-white/8 active:scale-[0.99]"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 transition group-hover:bg-white/15">
          <Upload size={28} className="text-white/60" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-1">Upload Your Photo</h2>
        <p className="text-sm text-white/40 mb-4">Drag & drop or tap to choose</p>
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition group-hover:bg-slate-100">
          <Camera size={15} /> Choose Photo
        </div>
        <p className="mt-3 text-xs text-white/30">JPG or PNG · Camera roll or gallery</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {/* Tips grid */}
      <div className="w-full">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-white/30">
          Photo Tips
        </p>
        <div className="grid grid-cols-2 gap-2">
          {tips.map(({ ok, text }) => (
            <div
              key={text}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs ${
                ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
              }`}
            >
              <span className="text-base">{ok ? '✅' : '❌'}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Example instruction */}
      <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
        <p className="text-[11px] text-white/40 leading-relaxed">
          Stand 1.5–2 metres from camera · Show full upper body · Keep shoulders visible
        </p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PhotoTryOn() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const location   = useLocation()
  const { addToCart, saveLook } = useCart()

  const product = useMemo(() => products.find((p) => p.id === id), [id])

  const [photo,         setPhoto]         = useState(null)
  const [selectedColor, setSelectedColor] = useState(location.state?.selectedColor || product?.colors?.[0] || '')
  const [selectedSize,  setSelectedSize]  = useState(location.state?.selectedSize  || product?.sizes?.[0]  || '')
  const [overlay,       setOverlay]       = useState({ ...DEFAULT_OVERLAY })
  const [imgError,      setImgError]      = useState(false)
  const [savedMsg,      setSavedMsg]      = useState('')
  const [isSaving,      setIsSaving]      = useState(false)

  // Keep ref in sync with overlay state for drag closure
  const overlayRef  = useRef(overlay)
  const previewRef  = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => { overlayRef.current = overlay }, [overlay])

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Product not found.</p>
          <button onClick={() => navigate('/shop')} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900">
            Back to Shop
          </button>
        </div>
      </main>
    )
  }

  const colorFilter = COLOR_FILTERS[selectedColor] ?? 'none'
  const dressImg    = product.dressImage || product.overlay

  // ── Photo upload ──────────────────────────────────────────────────────────
  const handlePhoto = (dataUrl) => {
    setPhoto(dataUrl)
    setOverlay({ ...DEFAULT_OVERLAY })
    setImgError(false)
  }

  // ── Drag (pointer events) ─────────────────────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    const container = previewRef.current
    if (!container) return

    const rect       = container.getBoundingClientRect()
    const startMouseX = e.clientX
    const startMouseY = e.clientY
    const startX      = overlayRef.current.x
    const startY      = overlayRef.current.y
    const cW          = rect.width
    const cH          = rect.height

    const onMove = (me) => {
      const dx = ((me.clientX - startMouseX) / cW) * 100
      const dy = ((me.clientY - startMouseY) / cH) * 100
      setOverlay((prev) => ({
        ...prev,
        x: Math.max(5,  Math.min(95, startX + dx)),
        y: Math.max(-5, Math.min(90, startY + dy)),
      }))
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
  }, [])

  // ── Nudge buttons ─────────────────────────────────────────────────────────
  const nudge = (dir) => {
    const step = 2
    setOverlay((prev) => {
      switch (dir) {
        case 'up':    return { ...prev, y: Math.max(-5, prev.y - step) }
        case 'down':  return { ...prev, y: Math.min(90, prev.y + step) }
        case 'left':  return { ...prev, x: Math.max(5,  prev.x - step) }
        case 'right': return { ...prev, x: Math.min(95, prev.x + step) }
        default:      return prev
      }
    })
  }

  // ── Save look ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!previewRef.current || !photo) return
    setIsSaving(true)
    setSavedMsg('')
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(previewRef.current, {
        useCORS: true,
        allowTaint: false,
        scale: 1.5,
        logging: false,
        imageTimeout: 10000,
      })
      const imageData = canvas.toDataURL('image/png')
      saveLook({ productId: product.id, name: product.name, image: imageData, selectedColor, selectedSize })
      setSavedMsg('✅ Look saved to Saved Looks!')
    } catch (err) {
      console.error('html2canvas error:', err)
      setSavedMsg('❌ Could not save. Try again.')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSavedMsg(''), 4000)
    }
  }

  // ── Add to cart ───────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    let preview = null
    if (previewRef.current && photo) {
      try {
        const { default: html2canvas } = await import('html2canvas')
        const canvas = await html2canvas(previewRef.current, { useCORS: true, scale: 1, logging: false })
        preview = canvas.toDataURL('image/png')
      } catch (_) {}
    }
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.image,
      selectedColor,
      selectedSize,
      quantity: 1,
      price: product.price,
      savedLookImage: preview,
    })
    navigate('/cart')
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-sm text-white/50 hover:text-white transition">← Back</button>
          <span className="text-sm font-semibold text-white">Try On Your Photo</span>
          <span className="text-xs text-white/30 max-w-[100px] truncate">{product.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">

        {/* ── Upload zone (if no photo yet) ── */}
        {!photo ? (
          <UploadZone onPhoto={handlePhoto} />
        ) : (
          <>
            {/* ── Preview Canvas Area ── */}
            <div className="relative">
              <div
                ref={previewRef}
                className="relative w-full overflow-hidden rounded-3xl bg-slate-900"
                style={{ aspectRatio: '3/4' }}
              >
                {/* Customer photo */}
                <img
                  src={photo}
                  alt="Your photo"
                  className="absolute inset-0 h-full w-full object-cover select-none"
                  crossOrigin="anonymous"
                  draggable={false}
                />

                {/* Overlay gradient for depth */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

                {/* ── Dress Overlay ── */}
                {!imgError ? (
                  <img
                    src={dressImg}
                    alt={`${product.name} overlay`}
                    crossOrigin="anonymous"
                    draggable={false}
                    onError={() => setImgError(true)}
                    onPointerDown={handlePointerDown}
                    className="absolute cursor-grab select-none touch-none active:cursor-grabbing"
                    style={{
                      left:      `${overlay.x}%`,
                      top:       `${overlay.y}%`,
                      width:     `${overlay.width}%`,
                      transform: `translateX(-50%) rotate(${overlay.rotate}deg)`,
                      filter:    colorFilter === 'none' ? undefined : colorFilter,
                      opacity:   0.90,
                      transition: 'filter 0.35s ease',
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-2xl bg-black/60 p-5 text-center backdrop-blur-sm">
                      <ImageOff size={24} className="mx-auto mb-2 text-white/40" />
                      <p className="text-xs text-white/40">Dress image not available</p>
                    </div>
                  </div>
                )}

                {/* Drag hint badge */}
                <div className="pointer-events-none absolute bottom-3 inset-x-0 flex justify-center">
                  <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] text-white/50 backdrop-blur-sm">
                    👆 Drag dress to reposition
                  </span>
                </div>
              </div>

              {/* Change photo link */}
              <div className="mt-2 flex justify-center">
                <button
                  onClick={() => { setPhoto(null); setOverlay({ ...DEFAULT_OVERLAY }); setImgError(false) }}
                  className="text-xs text-white/30 underline hover:text-white/60 transition"
                >
                  Change photo
                </button>
              </div>
            </div>

            {/* ── Controls Panel ── */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 space-y-5 backdrop-blur-sm">

              {/* Color & Size selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-widest text-white/30">Color</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`rounded-full border px-2.5 py-1.5 text-xs font-medium transition active:scale-95 ${
                          selectedColor === c
                            ? 'border-white bg-white text-slate-900'
                            : 'border-white/15 text-white/50 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-widest text-white/30">Size</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                          selectedSize === s
                            ? 'border-white bg-white text-slate-900'
                            : 'border-white/15 text-white/50 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resize slider */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                    <ZoomIn size={12} /> Dress Size
                  </p>
                  <span className="text-[10px] text-white/30">{Math.round(overlay.width)}%</span>
                </div>
                <input
                  type="range" min="20" max="90" step="1"
                  value={overlay.width}
                  onChange={(e) => setOverlay((prev) => ({ ...prev, width: Number(e.target.value) }))}
                  className="w-full h-1.5 accent-white rounded-full"
                />
                <div className="mt-1 flex justify-between text-[9px] text-white/20">
                  <span>Smaller</span><span>Larger</span>
                </div>
              </div>

              {/* Rotate slider */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-white/30">Rotation</p>
                  <span className="text-[10px] text-white/30">{overlay.rotate}°</span>
                </div>
                <input
                  type="range" min="-30" max="30" step="1"
                  value={overlay.rotate}
                  onChange={(e) => setOverlay((prev) => ({ ...prev, rotate: Number(e.target.value) }))}
                  className="w-full h-1.5 accent-white rounded-full"
                />
                <div className="mt-1 flex justify-between text-[9px] text-white/20">
                  <span>◄ Left</span><span>Right ►</span>
                </div>
              </div>

              {/* Fine-tune position buttons */}
              <div>
                <p className="mb-3 text-[10px] uppercase tracking-widest text-white/30">Fine Position</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* D-pad */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <div />
                      <button onClick={() => nudge('up')} className="rounded-xl bg-white/10 p-2.5 hover:bg-white/20 transition active:scale-90">
                        <ChevronUp size={15} />
                      </button>
                      <div />
                      <button onClick={() => nudge('left')} className="rounded-xl bg-white/10 p-2.5 hover:bg-white/20 transition active:scale-90">
                        <ChevronLeft size={15} />
                      </button>
                      <div className="flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white/20" />
                      </div>
                      <button onClick={() => nudge('right')} className="rounded-xl bg-white/10 p-2.5 hover:bg-white/20 transition active:scale-90">
                        <ChevronRight size={15} />
                      </button>
                      <div />
                      <button onClick={() => nudge('down')} className="rounded-xl bg-white/10 p-2.5 hover:bg-white/20 transition active:scale-90">
                        <ChevronDown size={15} />
                      </button>
                      <div />
                    </div>
                  </div>

                  {/* Reset */}
                  <button
                    onClick={() => setOverlay({ ...DEFAULT_OVERLAY })}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-xs text-white/50 hover:bg-white/10 hover:text-white transition active:scale-95"
                  >
                    <RotateCcw size={16} />
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <Info size={13} className="mt-0.5 shrink-0 text-white/30" />
              <p className="text-[10px] text-white/30 leading-relaxed">
                This is a visual preview only. Actual fit, fabric appearance, and size may vary depending on body shape and garment material.
              </p>
            </div>

            {/* Action buttons */}
            <div className="grid gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
              >
                <Save size={15} />
                {isSaving ? 'Saving preview…' : 'Save Look'}
              </button>
              <button
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 active:scale-[0.98]"
              >
                <ShoppingCart size={15} />
                Add to Cart
              </button>
            </div>

            {savedMsg && (
              <p className={`text-center text-sm font-medium ${savedMsg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>
                {savedMsg}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}
