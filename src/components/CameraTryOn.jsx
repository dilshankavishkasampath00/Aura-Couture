import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Pose } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'

const CameraTryOn = forwardRef(
  ({ overlayUrl, facingMode, onReady, onError, onPoseUpdate, onPermissionChange }, ref) => {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const cameraRef = useRef(null)
    const poseRef = useRef(null)
    const [permissionState, setPermissionState] = useState('loading')
    const [position, setPosition] = useState({ x: 0.5, y: 0.25, scale: 1.1, rotation: 0 })
    const [bodyDetected, setBodyDetected] = useState(false)

    useImperativeHandle(ref, () => ({
      capturePhoto: async () => {
        if (!videoRef.current || !canvasRef.current) return null

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        if (overlayUrl) {
          try {
            const overlayImage = new Image()
            overlayImage.crossOrigin = 'anonymous'
            overlayImage.src = overlayUrl
            await new Promise((resolve, reject) => {
              overlayImage.onload = resolve
              overlayImage.onerror = reject
            })
            const overlayWidth = canvas.width * position.scale
            const overlayHeight = (overlayImage.height / overlayImage.width) * overlayWidth
            const x = canvas.width * position.x - overlayWidth / 2
            const y = canvas.height * position.y - overlayHeight / 3
            ctx.drawImage(overlayImage, x, y, overlayWidth, overlayHeight)
          } catch (captureError) {
            console.warn('Overlay capture failed, saving camera frame only.', captureError)
          }
        }

        return canvas.toDataURL('image/png')
      }
    }))

    useEffect(() => {
      const startCamera = async () => {
        if (!videoRef.current) return

        if (cameraRef.current) {
          cameraRef.current.stop()
          cameraRef.current = null
        }
        if (poseRef.current) {
          poseRef.current.close()
          poseRef.current = null
        }

        const videoElement = videoRef.current
        const poseInstance = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` })
        poseInstance.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })
        poseRef.current = poseInstance

        poseInstance.onResults((results) => {
          const landmarks = results.poseLandmarks || []
          const leftShoulder = landmarks[11]
          const rightShoulder = landmarks[12]
          const leftHip = landmarks[23]
          const rightHip = landmarks[24]

          const hasBody = leftShoulder && rightShoulder && leftHip && rightHip
          setBodyDetected(Boolean(hasBody))
          onPoseUpdate?.(Boolean(hasBody))

          if (hasBody) {
            const centerX = (leftShoulder.x + rightShoulder.x) / 2
            const centerY = (leftShoulder.y + rightHip.y) / 2
            const width = Math.abs(leftShoulder.x - rightShoulder.x) * 2.2
            setPosition({
              x: Math.min(0.85, Math.max(0.15, centerX)),
              y: Math.min(0.55, Math.max(0.15, centerY)),
              scale: Math.max(0.9, Math.min(1.8, width)),
              rotation: 0
            })
          }
        })

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false
          })
          videoElement.srcObject = stream
          await videoElement.play()
          setPermissionState('granted')
          onPermissionChange?.('granted')
          onReady?.()

          cameraRef.current = new Camera(videoElement, {
            onFrame: async () => {
              if (poseRef.current) await poseRef.current.send({ image: videoElement })
            }
          })
          cameraRef.current.start()
        } catch (error) {
          console.error(error)
          setPermissionState('denied')
          onPermissionChange?.('denied')
          onError?.(error)
        }
      }

      startCamera()

      return () => {
        if (cameraRef.current) cameraRef.current.stop()
        if (poseRef.current) poseRef.current.close()
      }
    }, [facingMode, onError, onPermissionChange, onPoseUpdate, onReady])

    return (
      <div className="relative h-screen w-full overflow-hidden bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        <img
          src={overlayUrl}
          alt="Dress overlay"
          className="pointer-events-none absolute left-1/2 top-[26%] h-auto w-[68%] max-w-none -translate-x-1/2 opacity-90"
          style={{ transform: `translateX(-50%) translateY(-10%) scale(${position.scale}) rotate(${position.rotation}deg)` }}
        />

        <div className="absolute inset-x-0 top-4 flex items-center justify-center gap-3 px-4">
          <div className="rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm">
            {permissionState === 'loading' && 'Starting camera...'}
            {permissionState === 'granted' && (bodyDetected ? 'Body detected' : 'Position yourself in view')}
            {permissionState === 'denied' && 'Camera permission denied'}
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-[55%] w-[72%] rounded-[2rem] border border-white/40 bg-white/5 backdrop-blur-sm" />
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }
)

export default CameraTryOn
