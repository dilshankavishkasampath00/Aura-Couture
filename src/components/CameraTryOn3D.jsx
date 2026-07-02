import { forwardRef, useEffect, useImperativeHandle, useRef, useState, Suspense } from 'react'
import { Pose } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'
import { Canvas, useThree } from '@react-three/fiber'
import Model3D from './Model3D.jsx'

const Scene = ({ poseData, colorStr, modelUrl }) => {
  const { viewport } = useThree()
  
  // Map normalized coordinates [0, 1] to Three.js world coordinates
  const x = (poseData.x - 0.5) * viewport.width
  const y = -(poseData.y - 0.5) * viewport.height
  const z = 0 // Keeping it flat on Z for now, could use poseData.z if needed

  // Base scale on the width of the shoulders relative to the viewport
  const scale = poseData.width * viewport.width * 1.5

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 5, 5]} intensity={1.5} />
      <Model3D 
        modelUrl={modelUrl} 
        position={[x, y, z]} 
        scale={[scale, scale, scale]} 
        rotation={poseData.rotation} 
        colorStr={colorStr} 
      />
    </>
  )
}

const CameraTryOn3D = forwardRef(
  ({ modelUrl, facingMode, colorStr, onReady, onError, onPoseUpdate, onPermissionChange }, ref) => {
    const videoRef = useRef(null)
    const canvasRef = useRef(null) // For capturing the 2D video + 3D overlay later
    const r3fCanvasRef = useRef(null)
    const cameraRef = useRef(null)
    const poseRef = useRef(null)
    const [permissionState, setPermissionState] = useState('loading')
    const [bodyDetected, setBodyDetected] = useState(false)
    
    // Store pose data: x, y (normalized center), width (normalized shoulder width), rotation
    const [poseData, setPoseData] = useState({ x: 0.5, y: 0.5, width: 0.3, rotation: [0, 0, 0] })

    useImperativeHandle(ref, () => ({
      capturePhoto: async () => {
        if (!videoRef.current || !canvasRef.current) return null

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Draw video feed
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Draw 3D Canvas on top
        if (r3fCanvasRef.current) {
           const threeCanvas = r3fCanvasRef.current
           ctx.drawImage(threeCanvas, 0, 0, canvas.width, canvas.height)
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
          modelComplexity: 1, // Higher complexity for better 3D tracking
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
            const width = Math.abs(leftShoulder.x - rightShoulder.x)
            
            // Calculate basic rotation
            // Yaw (Y axis): depth difference between shoulders
            const depthDiff = leftShoulder.z - rightShoulder.z
            const yaw = Math.asin(Math.max(-1, Math.min(1, depthDiff / width))) || 0
            
            // Roll (Z axis): height difference between shoulders
            const heightDiff = leftShoulder.y - rightShoulder.y
            const roll = Math.atan2(heightDiff, width) || 0

            setPoseData({
              x: centerX,
              y: centerY,
              width: Math.max(0.1, width), // Prevent 0 width
              rotation: [0, yaw * -1, roll * -1] 
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
        
        {/* R3F Canvas - absolutely positioned over video */}
        <div className="absolute inset-0 pointer-events-none">
           {permissionState === 'granted' && bodyDetected && (
              <Canvas ref={r3fCanvasRef} gl={{ preserveDrawingBuffer: true }} camera={{ position: [0, 0, 5], fov: 50 }}>
                <Suspense fallback={null}>
                  <Scene poseData={poseData} colorStr={colorStr} modelUrl={modelUrl} />
                </Suspense>
              </Canvas>
           )}
        </div>

        <div className="absolute inset-x-0 top-4 flex items-center justify-center gap-3 px-4">
          <div className="rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm">
            {permissionState === 'loading' && 'Starting camera...'}
            {permissionState === 'granted' && (bodyDetected ? 'Body detected (3D Mode)' : 'Position yourself in view')}
            {permissionState === 'denied' && 'Camera permission denied'}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }
)

export default CameraTryOn3D
