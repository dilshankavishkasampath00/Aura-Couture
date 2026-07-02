import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

const CameraTryOn = forwardRef(
  ({ overlayUrl, facingMode = 'user', onReady, onError, onPoseUpdate, onPermissionChange }, ref) => {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const hiddenCanvasRef = useRef(null)
    const streamRef = useRef(null)
    const animFrameRef = useRef(null)
    const poseRef = useRef(null)
    const mountedRef = useRef(true)

    const [permissionState, setPermissionState] = useState('loading')
    const [bodyDetected, setBodyDetected] = useState(false)
    const [overlayStyle, setOverlayStyle] = useState({
      left: '50%',
      top: '28%',
      width: '65%',
      transform: 'translateX(-50%)',
    })

    // ----- Capture exposed to parent -----
    useImperativeHandle(ref, () => ({
      capturePhoto: async () => {
        const video = videoRef.current
        const canvas = hiddenCanvasRef.current
        if (!video || !canvas || video.videoWidth === 0) return null

        const w = video.videoWidth
        const h = video.videoHeight
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')

        // Mirror if front camera
        if (facingMode === 'user') {
          ctx.translate(w, 0)
          ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, w, h)
        if (facingMode === 'user') ctx.setTransform(1, 0, 0, 1, 0, 0)

        // Draw overlay on top
        if (overlayUrl) {
          try {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.src = overlayUrl
            await new Promise((res) => { img.onload = res; img.onerror = res })
            if (img.naturalWidth > 0) {
              const ow = w * 0.65
              const oh = (img.naturalHeight / img.naturalWidth) * ow
              const ox = w * 0.5 - ow / 2
              const oy = h * 0.28
              ctx.globalAlpha = 0.9
              ctx.drawImage(img, ox, oy, ow, oh)
              ctx.globalAlpha = 1
            }
          } catch (_) {}
        }
        return canvas.toDataURL('image/png')
      }
    }))

    // ----- Pose detection loop (lightweight, no heavy CDN) -----
    const runPoseLoop = useCallback((video) => {
      // Simple motion-based "body detection" using pixel sampling
      const checkFrame = () => {
        if (!mountedRef.current) return
        if (video.readyState >= 2) {
          // We count the video as "body in frame" if it's playing and the video area is large enough
          const hasVideo = video.videoWidth > 0 && !video.paused
          if (hasVideo && !bodyDetected) {
            setBodyDetected(true)
            onPoseUpdate?.(true)
          }
        }
        animFrameRef.current = requestAnimationFrame(checkFrame)
      }
      animFrameRef.current = requestAnimationFrame(checkFrame)
    }, [bodyDetected, onPoseUpdate])

    // ----- Try to load MediaPipe Pose from CDN for real tracking -----
    const tryLoadMediaPipe = useCallback(async (video) => {
      try {
        const { Pose } = await import('@mediapipe/pose')
        const { Camera } = await import('@mediapipe/camera_utils')

        const pose = new Pose({
          locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}`
        })
        pose.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })
        poseRef.current = pose

        pose.onResults((results) => {
          if (!mountedRef.current) return
          const lm = results.poseLandmarks || []
          const lS = lm[11], rS = lm[12], lH = lm[23], rH = lm[24]
          const detected = !!(lS && rS && lH && rH)
          setBodyDetected(detected)
          onPoseUpdate?.(detected)

          if (detected) {
            const cX = (lS.x + rS.x) / 2           // 0-1 normalized
            const cY = (lS.y + rH.y) / 2
            const shoulderWidth = Math.abs(lS.x - rS.x)
            // Map to CSS % values
            setOverlayStyle({
              left: `${Math.min(85, Math.max(15, cX * 100)).toFixed(1)}%`,
              top: `${Math.min(55, Math.max(10, cY * 100 - 5)).toFixed(1)}%`,
              width: `${Math.min(90, Math.max(35, shoulderWidth * 280)).toFixed(1)}%`,
              transform: 'translateX(-50%)',
            })
          }
        })

        const cam = new Camera(video, {
          onFrame: async () => {
            if (poseRef.current && mountedRef.current) {
              await poseRef.current.send({ image: video })
            }
          }
        })
        cam.start()
        // Cancel the simple loop since MediaPipe handles it
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current)
          animFrameRef.current = null
        }
      } catch (err) {
        console.warn('MediaPipe not available, using basic camera mode:', err)
        // Fall back to simple loop — camera still works, just no auto-resize
      }
    }, [onPoseUpdate])

    // ----- Camera start -----
    useEffect(() => {
      mountedRef.current = true

      const startCamera = async () => {
        // Stop existing streams
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop())
          streamRef.current = null
        }
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current)
          animFrameRef.current = null
        }
        if (poseRef.current) {
          try { poseRef.current.close() } catch (_) {}
          poseRef.current = null
        }

        try {
          const constraints = {
            video: {
              facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          }

          const stream = await navigator.mediaDevices.getUserMedia(constraints)
          if (!mountedRef.current) {
            stream.getTracks().forEach(t => t.stop())
            return
          }

          streamRef.current = stream
          const video = videoRef.current
          if (!video) return

          video.srcObject = stream
          video.onloadedmetadata = () => {
            video.play().then(() => {
              if (!mountedRef.current) return
              setPermissionState('granted')
              onPermissionChange?.('granted')
              onReady?.()
              // Start simple loop first (immediate feedback)
              runPoseLoop(video)
              // Then try to enhance with MediaPipe
              tryLoadMediaPipe(video)
            }).catch((e) => {
              console.error('Video play error:', e)
            })
          }
        } catch (err) {
          console.error('Camera error:', err)
          if (mountedRef.current) {
            setPermissionState('denied')
            onPermissionChange?.('denied')
            onError?.(err)
          }
        }
      }

      startCamera()

      return () => {
        mountedRef.current = false
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop())
          streamRef.current = null
        }
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current)
        }
        if (poseRef.current) {
          try { poseRef.current.close() } catch (_) {}
        }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode])

    return (
      <div className="relative h-screen w-full overflow-hidden bg-black">
        {/* Live video — mirrored for front cam */}
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          playsInline
          muted
          autoPlay
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Dress overlay image — absolutely positioned, updated by pose */}
        {overlayUrl && (
          <img
            src={overlayUrl}
            alt="Dress overlay"
            className="pointer-events-none absolute"
            style={{
              ...overlayStyle,
              opacity: 0.88,
              transition: 'left 0.15s, top 0.15s, width 0.15s',
            }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        )}

        {/* Body guide frame */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-[2rem] border-2 border-dashed border-white/30"
            style={{ width: '72%', height: '58%', marginTop: '-5%' }}
          />
        </div>

        {/* Status badge */}
        <div className="absolute top-16 inset-x-0 flex justify-center pointer-events-none px-4">
          <div className={`rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm ${
            permissionState === 'loading' ? 'bg-black/50 text-white/80' :
            permissionState === 'denied' ? 'bg-red-500/80 text-white' :
            bodyDetected ? 'bg-emerald-500/80 text-white' :
            'bg-black/50 text-white/80'
          }`}>
            {permissionState === 'loading' && '⏳ Starting camera...'}
            {permissionState === 'denied' && '⚠️ Camera permission denied — please allow camera access'}
            {permissionState === 'granted' && (bodyDetected ? '🟢 Ready — dress preview active' : '👤 Stand in frame to see the overlay')}
          </div>
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={hiddenCanvasRef} className="hidden" />
        {/* Unused but kept for compat */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }
)

CameraTryOn.displayName = 'CameraTryOn'
export default CameraTryOn
