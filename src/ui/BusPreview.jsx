import React, { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export default function BusPreview({ glbUrl, bodyUrl, alphaUrl, pose, poseData }) {
  const { scene } = useGLTF(glbUrl)
  const { camera } = useThree()
  
  useEffect(() => {
    if (!scene) return
    
    // Apply textures if provided
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Apply body texture
        if (bodyUrl && (child.material.name === 'bodybasic' || child.material.name?.toLowerCase().includes('body'))) {
          const loader = new THREE.TextureLoader()
          loader.load(bodyUrl, (texture) => {
            child.material.map = texture
            child.material.needsUpdate = true
          })
        }
        
        // Apply alpha texture
        if (alphaUrl && (child.material.name === 'alpha' || child.material.name?.toLowerCase().includes('alpha') || child.material.name?.toLowerCase().includes('glass'))) {
          const loader = new THREE.TextureLoader()
          loader.load(alphaUrl, (texture) => {
            child.material.map = texture
            child.material.transparent = true
            child.material.needsUpdate = true
          })
        }
      }
    })
  }, [scene, bodyUrl, alphaUrl])

  // Apply camera position from pose data
  useEffect(() => {
    if (poseData && camera) {
      camera.position.set(poseData.camera_pos.x, poseData.camera_pos.y, poseData.camera_pos.z)
      camera.lookAt(poseData.target_pos.x, poseData.target_pos.y, poseData.target_pos.z)
      
      // Apply zoom and FOV if available (minimum FOV is now 1)
      if (poseData.camera_fov) {
        camera.fov = Math.max(1, poseData.camera_fov)
      }
      
      camera.updateProjectionMatrix()
    }
  }, [poseData, camera])

  return <primitive object={scene} />
}