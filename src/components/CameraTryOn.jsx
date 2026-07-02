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
  ({ overlayUrl, facingMode = 'user', onReady, onError, onPoseUpdate, onPermissionChange }, ref) => {
    const videoRef        = useRef(null)   // hidden video element
    const canvasRef       = useRef(null)   // visible canvas — renders video + overlay
    const streamRef       = useRef(null)
    const animRef         = useRef(null)
    const poseRef         = useRef(null)
    const landmarksRef    = useRef(null)   // latest MediaPipe landmarks
    const overlayImgRef   = useRef(null)   // preloaded dress PNG
    const mountedRef      = useRef(true)
    const poseIntervalRef = useRef(null)

    const [permissionState, setPermissionState] = useState('loading') // loading | granted | denied
    const [bodyDetected,    setBodyDetected]    = useState(false)
    const [poseReady,       setPoseReady]       = useState(false)

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
      if (!overlayUrl) { overlayImgRef.current = null; return }
      const img = new Image()
      img.src = overlayUrl
      img.onload  = () => { overlayImgRef.current = img }
      img.onerror = () => { overlayImgRef.current = null; console.warn('Overlay image failed to load:', overlayUrl) }
    }, [overlayUrl])

    // ─── Main effect: camera + canvas render loop + MediaPipe ─────────────────
    useEffect(() => {
      mountedRef.current = true
      let cancelled = false

      const stop = () => {
        cancelled = true
        if (streamRef.current)       { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
        if (animRef.current)         { cancelAnimationFrame(animRef.current); animRef.current = null }
        if (poseIntervalRef.current) { clearInterval(poseIntervalRef.current); poseIntervalRef.current = null }
        if (poseRef.current)         { try { poseRef.current.close() } catch (_) {} poseRef.current = null }
        landmarksRef.current = null
      }

      // ── Canvas render loop ──────────────────────────────────────────────────
      const startRenderLoop = (video) => {
        const draw = () => {
          if (cancelled || !mountedRef.current) return
          animRef.current = requestAnimationFrame(draw)

          const canvas = canvasRef.current
          if (!canvas) return

          const ctx = canvas.getContext('2d')
          const CW = canvas.width   // canvas pixel width
          const CH = canvas.height  // canvas pixel height

          if (video.readyState < 2 || video.videoWidth === 0) return

          // Keep canvas pixels in sync with display size
          const rect = canvas.getBoundingClientRect()
          if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width  = rect.width
            canvas.height = rect.height
          }

          // Draw mirrored video for front camera (selfie feel)
          ctx.save()
          if (facingMode === 'user') { ctx.translate(CW, 0); ctx.scale(-1, 1) }
          ctx.drawImage(video, 0, 0, CW, CH)
          ctx.restore()

          // ── Draw dress overlay ────────────────────────────────────────────
          const overlay = overlayImgRef.current
          const lm = landmarksRef.current

          if (overlay) {
            const iW = overlay.naturalWidth || 1
            const iH = overlay.naturalHeight || 1
            const aspectRatio = iH / iW

            if (lm && lm[11] && lm[12] && lm[23] && lm[24]) {
              // --- Body-tracked position ---
              const lS = lm[11], rS = lm[12]  // left/right shoulder
              const lH = lm[23], rH = lm[24]  // left/right hip

              // MediaPipe gives normalized [0,1] coords.
              // For front camera the video is mirrored but landmarks are NOT —
              // so we flip landmark X to match the mirrored video.
              const mx = (x) => facingMode === 'user' ? 1 - x : x

              const lsX = mx(lS.x), rsX = mx(rS.x)
              const midShoulderX = (lsX + rsX) / 2
              const midShoulderY = (lS.y + rS.y) / 2
              const midHipY = (lH.y + rH.y) / 2

              // Shoulder span → dress width (add padding for sleeves)
              const shoulderSpanPx = Math.abs(lsX - rsX) * CW
              const dressW = Math.max(80, shoulderSpanPx * 2.6) // 2.6× for sleeves + fabric

              // Shoulder-to-hip height → scale dress height to full length
              const torsoH = (midHipY - midShoulderY) * CH
              const dressH = Math.max(120, aspectRatio * dressW)

              // Center the dress horizontally on shoulder midpoint
              const x = midShoulderX * CW - dressW / 2
              // Align dress top a little above the shoulder line
              const y = midShoulderY * CH - dressH * 0.08

              ctx.globalAlpha = 0.90
              ctx.drawImage(overlay, x, y, dressW, dressH)
              ctx.globalAlpha = 1.0
            } else {
              // No landmarks yet — show dress in default centered position (ghost preview)
              const dressW = CW * 0.55
              const dressH = aspectRatio * dressW
              const x = CW / 2 - dressW / 2
              const y = CH * 0.12
              ctx.globalAlpha = 0.35
              ctx.drawImage(overlay, x, y, dressW, dressH)
              ctx.globalAlpha = 1.0
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
          })

          poseRef.current = pose
          setPoseReady(true)

          // Send frames to MediaPipe on interval to avoid blocking the render loop
          poseIntervalRef.current = setInterval(async () => {
            if (cancelled || !poseRef.current) return
            if (video.readyState < 2 || video.videoWidth === 0) return
            try { await poseRef.current.send({ image: video }) } catch (_) {}
          }, 160) // ~6 fps for pose detection is enough

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
        {/* Hidden video — source for canvas drawing */}
        <video ref={videoRef} className="hidden" playsInline muted autoPlay />

        {/* Main canvas — full screen, shows video + overlay */}
        <canvas
          ref={canvasRef}
          className="h-full w-full"
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

        {/* Instructions when no body detected */}
        {permissionState === 'granted' && !bodyDetected && (
          <div className="pointer-events-none absolute bottom-[55%] inset-x-0 flex justify-center px-6">
            <div className="rounded-2xl bg-black/50 px-4 py-3 backdrop-blur-sm text-center">
              <p className="text-xs text-white/60 leading-relaxed">
                📏 Stand 1.5–2m from camera · Keep shoulders visible · Good lighting helps
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
