import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

/**
 * CameraTryOn — Canvas-based Virtual Try-On
 *
 * Architecture:
 *   1. Hidden <video> captures the camera stream
 *   2. requestAnimationFrame loop draws video → canvas every frame
 *   3. MediaPipe Pose runs every ~150ms and writes landmarks to a ref
 *   4. Each canvas frame reads the latest landmarks and draws the dress overlay
 *      positioned / scaled to the person's shoulders & hips
 *
 * Capture (capturePhoto) just calls canvas.toDataURL() — the overlay is
 * already baked into the canvas, so the screenshot is correct.
 */
const CameraTryOn = forwardRef(
  ({ overlayUrl, facingMode = 'user', onReady, onError, onPoseUpdate, onPermissionChange, debugMode = true }, ref) => {
    const videoRef        = useRef(null)   // hidden video element
    const canvasRef       = useRef(null)   // visible canvas — renders video + overlay
    const streamRef       = useRef(null)
    const animRef         = useRef(null)
    const poseRef         = useRef(null)
    const landmarksRef    = useRef(null)   // latest MediaPipe landmarks
    const overlayImgRef   = useRef(null)   // preloaded dress PNG
    const mountedRef      = useRef(true)
    const lastPoseSendRef = useRef(0)

    const [permissionState, setPermissionState] = useState('loading') // loading | granted | denied
    const [bodyDetected,    setBodyDetected]    = useState(false)
    const [poseReady,       setPoseReady]       = useState(false)
    const [overlayStatus,   setOverlayStatus]   = useState('loading')
    const [overlayMessage,  setOverlayMessage]  = useState('Loading dress asset…')
    const [debugInfo,       setDebugInfo]       = useState({
      poseDetected: false,
      shoulderDistance: 0,
      leftShoulder: null,
      rightShoulder: null,
      leftHip: null,
      rightHip: null
    })

    // ─── Expose capturePhoto to parent ───────────────────────────────────────
    useImperativeHandle(ref, () => ({
      capturePhoto: () => {
        const canvas = canvasRef.current
        if (!canvas) return null
        return canvas.toDataURL('image/png')
      }
    }))

    // ─── Pre-load dress overlay image ─────────────────────────────────────────
    useEffect(() => {
      if (!overlayUrl) {
        overlayImgRef.current = null
        setOverlayStatus('idle')
        setOverlayMessage('No dress asset provided')
        return
      }

      setOverlayStatus('loading')
      setOverlayMessage('Loading dress asset…')
      const img = new Image()
      img.onload = () => {
        overlayImgRef.current = img
        setOverlayStatus('loaded')
        setOverlayMessage('')
      }
      img.onerror = () => {
        overlayImgRef.current = null
        setOverlayStatus('error')
        setOverlayMessage('Dress image failed to load')
        console.warn('Overlay image failed to load:', overlayUrl)
      }
      img.src = overlayUrl
    }, [overlayUrl])

    // ─── Main effect: camera + canvas render loop + MediaPipe ─────────────────
    useEffect(() => {
      mountedRef.current = true
      let cancelled = false

      const stop = () => {
        cancelled = true
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
        if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
        if (poseRef.current) { try { poseRef.current.close() } catch (_) {} poseRef.current = null }
        landmarksRef.current = null
      }

      // ── Canvas render loop ──────────────────────────────────────────────────
      const startRenderLoop = (video) => {
        const draw = (timestamp) => {
          if (cancelled || !mountedRef.current) return
          animRef.current = requestAnimationFrame(draw)

          const canvas = canvasRef.current
          if (!canvas) return

          const ctx = canvas.getContext('2d')
          const rect = canvas.getBoundingClientRect()
          if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width
            canvas.height = rect.height
          }

          const CW = canvas.width
          const CH = canvas.height

          if (video.readyState < 2 || video.videoWidth === 0) return

          ctx.clearRect(0, 0, CW, CH)

          // Draw mirrored video for the front camera.
          ctx.save()
          if (facingMode === 'user') {
            ctx.translate(CW, 0)
            ctx.scale(-1, 1)
          }
          ctx.drawImage(video, 0, 0, CW, CH)
          ctx.restore()

          const overlay = overlayImgRef.current
          const lm = landmarksRef.current
          const mirrorX = (x) => (facingMode === 'user' ? 1 - x : x)

          let overlayRect = null

          if (overlay) {
            const iW = overlay.naturalWidth || overlay.width || 1
            const iH = overlay.naturalHeight || overlay.height || 1
            const aspectRatio = iH / iW

            if (lm && lm[11] && lm[12] && lm[23] && lm[24]) {
              const lS = lm[11]
              const rS = lm[12]
              const lH = lm[23]
              const rH = lm[24]

              const leftShoulder = { x: mirrorX(lS.x), y: lS.y }
              const rightShoulder = { x: mirrorX(rS.x), y: rS.y }
              const leftHip = { x: mirrorX(lH.x), y: lH.y }
              const rightHip = { x: mirrorX(rH.x), y: rH.y }

              const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2
              const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2
              const midHipY = (leftHip.y + rightHip.y) / 2
              const shoulderSpanPx = Math.abs(leftShoulder.x - rightShoulder.x) * CW
              const dressW = Math.max(140, shoulderSpanPx * 2.4)
              const dressH = Math.max(160, dressW * aspectRatio)
              const x = Math.max(0, Math.min(CW - dressW, midShoulderX * CW - dressW / 2))
              const y = Math.max(20, midShoulderY * CH - dressH * 0.18)

              overlayRect = { x, y, width: dressW, height: dressH }
              ctx.globalAlpha = 0.95
              ctx.drawImage(overlay, x, y, dressW, dressH)
              ctx.globalAlpha = 1

              setBodyDetected(true)
              setDebugInfo({
                poseDetected: true,
                shoulderDistance: Number(Math.abs(leftShoulder.x - rightShoulder.x).toFixed(3)),
                leftShoulder,
                rightShoulder,
                leftHip,
                rightHip
              })
            } else {
              const dressW = CW * 0.5
              const dressH = Math.max(160, dressW * aspectRatio)
              const x = CW / 2 - dressW / 2
              const y = CH * 0.16

              overlayRect = { x, y, width: dressW, height: dressH }
              ctx.globalAlpha = 0.55
              ctx.drawImage(overlay, x, y, dressW, dressH)
              ctx.globalAlpha = 1

              setBodyDetected(false)
              setDebugInfo((prev) => ({ ...prev, poseDetected: false }))
            }
          } else if (overlayStatus === 'error') {
            ctx.fillStyle = 'rgba(255,255,255,0.85)'
            ctx.font = '16px sans-serif'
            ctx.fillText('Dress image failed to load', 20, 30)
          }

          if (debugMode) {
            if (overlayRect) {
              ctx.strokeStyle = '#ff3b30'
              ctx.lineWidth = 2
              ctx.strokeRect(overlayRect.x, overlayRect.y, overlayRect.width, overlayRect.height)
            }

            if (lm && lm[11] && lm[12] && lm[23] && lm[24]) {
              const drawPoint = (point, color) => {
                const px = mirrorX(point.x) * CW
                const py = point.y * CH
                ctx.beginPath()
                ctx.fillStyle = color
                ctx.arc(px, py, 4, 0, Math.PI * 2)
                ctx.fill()
              }

              drawPoint(lm[11], '#34d399')
              drawPoint(lm[12], '#fbbf24')
              drawPoint(lm[23], '#60a5fa')
              drawPoint(lm[24], '#f43f5e')
            }
          }

          if (poseRef.current && video.readyState >= 2 && video.videoWidth > 0) {
            const now = performance.now()
            if (now - lastPoseSendRef.current > 160) {
              lastPoseSendRef.current = now
              void poseRef.current.send({ image: video }).catch(() => {})
            }
          }
        }

        animRef.current = requestAnimationFrame(draw)
      }

      // ── MediaPipe Pose ──────────────────────────────────────────────────────
      const startMediaPipe = async (video) => {
        try {
          const { Pose } = await import('@mediapipe/pose')

          if (cancelled) return

          const pose = new Pose({
            locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}`
          })

          pose.setOptions({
            modelComplexity:        1,
            smoothLandmarks:        true,
            enableSegmentation:     false,
            smoothSegmentation:     false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence:  0.5
          })

          pose.onResults((results) => {
            if (!mountedRef.current) return
            const lm = results.poseLandmarks || null
            landmarksRef.current = lm
            const detected = !!(lm && lm[11] && lm[12] && lm[23] && lm[24])
            setBodyDetected(detected)
            onPoseUpdate?.(detected)
            setPoseReady(true)
          })

          poseRef.current = pose
          setPoseReady(true)

        } catch (err) {
          console.warn('[CameraTryOn] MediaPipe load failed — overlay will use default position.', err)
          setPoseReady(false)
          // Still mark body as "detected" so overlay shows at full opacity
          setBodyDetected(true)
          onPoseUpdate?.(true)
        }
      }

      // ── Start camera ────────────────────────────────────────────────────────
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode,
              width:  { ideal: 1280 },
              height: { ideal: 720  }
            },
            audio: false
          })

          if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

          streamRef.current = stream
          const video = videoRef.current
          if (!video) return

          video.srcObject = stream

          await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve
            video.onerror = reject
          })

          await video.play()

          if (cancelled) return

          setPermissionState('granted')
          onPermissionChange?.('granted')
          onReady?.()

          startRenderLoop(video)
          startMediaPipe(video)        // non-blocking — overlay works even without it

        } catch (err) {
          console.error('[CameraTryOn] camera error:', err)
          if (mountedRef.current) {
            setPermissionState('denied')
            onPermissionChange?.('denied')
            onError?.(err)
          }
        }
      }

      startCamera()

      return stop
    // Re-run only when facingMode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode])

    // ─── Body guide lines (drawn as SVG so they don't interfere with canvas) ──
    const GuideLines = () => (
      <div className="pointer-events-none absolute inset-0">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Silhouette body guide */}
          <ellipse cx="50" cy="18" rx="9" ry="10" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
          <rect x="35" y="28" width="30" height="30" rx="5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
          <rect x="38" y="58" width="24" height="24" rx="3" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
        </svg>
      </div>
    )

    return (
      <div className="relative h-screen w-full overflow-hidden bg-black">
        {/* Camera input — positioned behind the canvas render layer */}
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover opacity-0" playsInline muted autoPlay />

        {/* Main canvas — full screen, shows video + overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ display: 'block' }}
        />

        {/* Subtle body guide */}
        {permissionState === 'granted' && !bodyDetected && <GuideLines />}

        {/* Bottom gradient for UI readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Status badge */}
        <div className="pointer-events-none absolute top-16 inset-x-0 flex justify-center px-4">
          <div className={`
            inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-md
            ${permissionState === 'loading'  ? 'bg-black/60 text-white/70'      : ''}
            ${permissionState === 'denied'   ? 'bg-red-600/80 text-white'       : ''}
            ${permissionState === 'granted' && !bodyDetected ? 'bg-black/60 text-white/80' : ''}
            ${permissionState === 'granted' &&  bodyDetected ? 'bg-emerald-600/80 text-white' : ''}
          `}>
            {permissionState === 'loading' && (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Starting camera…
              </>
            )}
            {permissionState === 'denied' && '⚠️ Camera permission denied — tap to allow'}
            {permissionState === 'granted' && !bodyDetected && (
              <>
                <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
                {!poseReady ? 'Loading pose AI… stand in frame' : 'Move back — show full upper body'}
              </>
            )}
            {permissionState === 'granted' && bodyDetected && (
              <>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                Body detected — dress aligned ✓
              </>
            )}
          </div>
        </div>

        {debugMode && (
          <div className="pointer-events-none absolute left-4 top-24 z-20 max-w-[260px] rounded-2xl border border-white/10 bg-black/70 p-3 text-[11px] text-white/80 shadow-xl backdrop-blur">
            <p className="font-semibold text-white">Debug overlay</p>
            <p>{bodyDetected ? 'Pose detected' : 'No pose detected'}</p>
            <p>Shoulder distance: {debugInfo.shoulderDistance.toFixed(3)}</p>
            <p>LS: {debugInfo.leftShoulder ? `${debugInfo.leftShoulder.x.toFixed(2)}, ${debugInfo.leftShoulder.y.toFixed(2)}` : '—'}</p>
            <p>RS: {debugInfo.rightShoulder ? `${debugInfo.rightShoulder.x.toFixed(2)}, ${debugInfo.rightShoulder.y.toFixed(2)}` : '—'}</p>
            <p>LH: {debugInfo.leftHip ? `${debugInfo.leftHip.x.toFixed(2)}, ${debugInfo.leftHip.y.toFixed(2)}` : '—'}</p>
            <p>RH: {debugInfo.rightHip ? `${debugInfo.rightHip.x.toFixed(2)}, ${debugInfo.rightHip.y.toFixed(2)}` : '—'}</p>
            <p className="mt-2 text-[10px] text-white/60">{overlayStatus === 'error' ? overlayMessage : overlayStatus}</p>
          </div>
        )}

        {/* Instructions when no body detected */}
        {permissionState === 'granted' && !bodyDetected && (
          <div className="pointer-events-none absolute bottom-[55%] inset-x-0 flex justify-center px-6">
            <div className="rounded-2xl bg-black/50 px-4 py-3 backdrop-blur-sm text-center">
              <p className="text-xs text-white/60 leading-relaxed">
                📏 Step back and keep shoulders and hips visible · Good lighting helps
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }
)

CameraTryOn.displayName = 'CameraTryOn'
export default CameraTryOn
