import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export default function Model3D({ modelUrl, position, scale, rotation, colorStr }) {
  const group = useRef()
  
  // If we had a real model:
  // const { scene } = useGLTF(modelUrl)
  // return <primitive object={scene} position={position} scale={scale} rotation={rotation} />

  // Smoothly interpolate position for less jitter
  const targetPos = new THREE.Vector3(position[0], position[1], position[2])
  
  useFrame((state, delta) => {
    if (group.current) {
      group.current.position.lerp(targetPos, 0.15) // Smooth movement
      group.current.rotation.z = rotation[2] // Roll
      group.current.rotation.y = rotation[1] // Yaw
    }
  })

  let hexColor = '#ffb3ad'
  if (colorStr === 'Black') hexColor = '#222222'
  if (colorStr === 'Red') hexColor = '#E11D48'
  if (colorStr === 'Blue') hexColor = '#3B82F6'

  return (
    <group ref={group} scale={scale}>
      {/* Torso/Dress placeholder */}
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.7, 1.3, 3.5, 32]} />
        <meshStandardMaterial color={hexColor} roughness={0.6} metalness={0.1} />
      </mesh>
    </group>
  )
}
