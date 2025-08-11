import React, { useRef, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function BusModel({ glbUrl, bodyUrl, alphaUrl, pose }) {
  const { scene } = useGLTF(glbUrl)
  const { camera } = useThree()
  
  // Apply textures with preserved UV mapping
  React.useEffect(() => {
    if (!scene) return
    
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Apply body texture with preserved UV mapping
        if (bodyUrl && (child.material.name === 'bodybasic' || child.material.name?.toLowerCase().includes('body'))) {
          const loader = new THREE.TextureLoader()
          loader.load(bodyUrl, (texture) => {
            // Critical: preserve original UV mapping
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.flipY = false // Don't flip texture - keep original orientation
            texture.generateMipmaps = true
            texture.minFilter = THREE.LinearMipmapLinearFilter
            texture.magFilter = THREE.LinearFilter
            
            // Clean up old texture
            if (child.material.map) {
              child.material.map.dispose()
            }
            
            child.material.map = texture
            child.material.needsUpdate = true
            
            console.log('Screenshot: Body texture applied with preserved UV to', child.material.name)
          })
        }
        
        // Apply alpha texture with preserved UV mapping
        if (alphaUrl && (child.material.name === 'alpha' || child.material.name?.toLowerCase().includes('alpha'))) {
          const loader = new THREE.TextureLoader()
          loader.load(alphaUrl, (texture) => {
            // Critical: preserve original UV mapping
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.flipY = false // Don't flip texture - keep original orientation
            texture.generateMipmaps = true
            texture.minFilter = THREE.LinearMipmapLinearFilter
            texture.magFilter = THREE.LinearFilter
            
            // Clean up old texture
            if (child.material.map) {
              child.material.map.dispose()
            }
            
            child.material.map = texture
            child.material.transparent = true
            child.material.alphaTest = 0.1
            child.material.needsUpdate = true
            
            console.log('Screenshot: Alpha texture applied with preserved UV to', child.material.name)
          })
        }
      }
    })
  }, [scene, bodyUrl, alphaUrl])

  // Apply camera pose
  React.useEffect(() => {
    if (pose && camera) {
      camera.position.set(pose.camera_pos.x, pose.camera_pos.y, pose.camera_pos.z)
      camera.lookAt(pose.target_pos.x, pose.target_pos.y, pose.target_pos.z)
      camera.updateProjectionMatrix()
    }
  }, [pose, camera])

  return <primitive object={scene} />
}

function CaptureHelper({ onReady }) {
  const { gl, scene, camera } = useThree()
  
  const captureScreenshot = useCallback(() => {
    gl.render(scene, camera)
    const canvas = gl.domElement
    return canvas.toDataURL('image/png')
  }, [gl, scene, camera])

  React.useEffect(() => {
    onReady(captureScreenshot)
  }, [captureScreenshot, onReady])

  return null
}

export default function ScreenshotCapture({ 
  glbUrl, 
  bodyUrl, 
  alphaUrl, 
  pose, 
  onScreenshot,
  width = 400,
  height = 300 
}) {
  const captureRef = useRef(null)

  const handleCapture = useCallback(() => {
    if (captureRef.current) {
      const dataUrl = captureRef.current()
      if (onScreenshot) {
        onScreenshot(dataUrl)
      }
    }
  }, [onScreenshot])

  const handleCaptureReady = useCallback((captureFunc) => {
    captureRef.current = captureFunc
  }, [])

  return (
    <div>
      <div style={{ width, height }} className="border rounded overflow-hidden">
        {glbUrl ? (
          <Canvas camera={{ position: [5, 2, 5], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1} />
            <directionalLight position={[-3, 3, -3]} intensity={0.4} />
            <BusModel 
              glbUrl={glbUrl}
              bodyUrl={bodyUrl}
              alphaUrl={alphaUrl}
              pose={pose}
            />
            <OrbitControls enablePan enableZoom enableRotate />
            <CaptureHelper onReady={handleCaptureReady} />
          </Canvas>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
            Load model to preview
          </div>
        )}
      </div>
      
      {glbUrl && (
        <button
          onClick={handleCapture}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          📸 Take Screenshot
        </button>
      )}
    </div>
  )
}