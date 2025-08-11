import React, { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export default function BusPreview({ glbUrl, bodyUrl, alphaUrl, pose, poseData }) {
  const { scene } = useGLTF(glbUrl)
  const { camera } = useThree()
  
  useEffect(() => {
    if (!scene) return
    
    // Apply textures if provided with proper UV mapping
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Apply body texture with preserved UV mapping
        if (bodyUrl && (child.material.name === 'bodybasic' || child.material.name?.toLowerCase().includes('body'))) {
          const loader = new THREE.TextureLoader()
          loader.load(bodyUrl, (texture) => {
            // Preserve original UV mapping settings
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.flipY = false // Critical: preserve original orientation
            texture.generateMipmaps = true
            texture.minFilter = THREE.LinearMipmapLinearFilter
            texture.magFilter = THREE.LinearFilter
            
            // Don't modify UV coordinates - use original mapping
            // texture.repeat.set(1, 1)
            // texture.offset.set(0, 0)
            
            // Clean up old texture if exists
            if (child.material.map) {
              child.material.map.dispose()
            }
            
            child.material.map = texture
            child.material.needsUpdate = true
            
            console.log('Body texture applied with preserved UV mapping:', child.material.name)
          })
        }
        
        // Apply alpha texture with preserved UV mapping
        if (alphaUrl && (child.material.name === 'alpha' || child.material.name?.toLowerCase().includes('alpha') || child.material.name?.toLowerCase().includes('glass'))) {
          const loader = new THREE.TextureLoader()
          loader.load(alphaUrl, (texture) => {
            // Preserve original UV mapping settings
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.flipY = false // Critical: preserve original orientation
            texture.generateMipmaps = true
            texture.minFilter = THREE.LinearMipmapLinearFilter
            texture.magFilter = THREE.LinearFilter
            
            // Clean up old texture if exists
            if (child.material.map) {
              child.material.map.dispose()
            }
            
            child.material.map = texture
            child.material.transparent = true
            child.material.alphaTest = 0.1 // Better alpha handling
            child.material.needsUpdate = true
            
            console.log('Alpha texture applied with preserved UV mapping:', child.material.name)
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