import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { supabase } from '../lib/supabase'
import { useModel3DLoader } from '../hooks/useModel3DLoader'
import LoadingOverlay from '../components/LoadingOverlay'

function BusModel({ glbUrl, bodyUrl, alphaUrl, poseData }) {
  const { scene } = useGLTF(glbUrl)
  const { camera } = useThree()
  
  // Apply textures
  useEffect(() => {
    if (!scene) return
    
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

  // Apply camera pose
  useEffect(() => {
    if (poseData && camera) {
      camera.position.set(poseData.camera_pos.x, poseData.camera_pos.y, poseData.camera_pos.z)
      camera.lookAt(poseData.target_pos.x, poseData.target_pos.y, poseData.target_pos.z)
      
      if (poseData.camera_fov) {
        camera.fov = Math.max(5, poseData.camera_fov)
      }
      
      camera.updateProjectionMatrix()
    }
  }, [poseData, camera])

  return <primitive object={scene} />
}

function CaptureHelper({ onReady }) {
  const { gl, scene, camera } = useThree()
  
  const captureScreenshot = useCallback((width = 1920, height = 1080) => {
    // Set render size to HD
    const originalSize = gl.getSize(new THREE.Vector2())
    gl.setSize(width, height, false)
    
    // Update camera aspect ratio
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    
    // Render
    gl.render(scene, camera)
    const dataUrl = gl.domElement.toDataURL('image/png')
    
    // Restore original size
    gl.setSize(originalSize.x, originalSize.y, false)
    camera.aspect = originalSize.x / originalSize.y
    camera.updateProjectionMatrix()
    
    return dataUrl
  }, [gl, scene, camera])

  useEffect(() => {
    onReady(captureScreenshot)
  }, [captureScreenshot, onReady])

  return null
}

export default function TestingLiveryPage() {
  const [models, setModels] = useState([])
  const [poses, setPoses] = useState([])
  const [selectedModelId, setSelectedModelId] = useState('')
  const [selectedPoseId, setSelectedPoseId] = useState('')
  const [bodyFile, setBodyFile] = useState(null)
  const [alphaFile, setAlphaFile] = useState(null)
  const [bodyUrl, setBodyUrl] = useState(null)
  const [alphaUrl, setAlphaUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingPoses, setLoadingPoses] = useState(false)
  const captureRef = useRef(null)

  const selectedModel = models.find(m => m.id === selectedModelId)
  const selectedPose = poses.find(p => p.id === selectedPoseId)
  
  // Use 3D model loader with progress
  const { 
    loadingProgress, 
    isLoading: modelLoading, 
    loadingMessage,
    error: modelError 
  } = useModel3DLoader(selectedModel?.glb_url)

  useEffect(() => {
    loadModels()
  }, [])

  useEffect(() => {
    if (selectedModelId) {
      loadPoses()
    } else {
      setPoses([])
      setSelectedPoseId('')
    }
  }, [selectedModelId])

  async function loadModels() {
    try {
      setLoading(true)
      const { data } = await supabase.from('models').select('*').order('name')
      setModels(data || [])
    } catch (error) {
      console.error('Error loading models:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPoses() {
    try {
      setLoadingPoses(true)
      const { data } = await supabase.from('poses').select('*').eq('model_id', selectedModelId).order('name')
      setPoses(data || [])
    } catch (error) {
      console.error('Error loading poses:', error)
    } finally {
      setLoadingPoses(false)
    }
  }

  function handleBodyFile(file) {
    setBodyFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setBodyUrl(url)
    } else {
      setBodyUrl(null)
    }
  }

  function handleAlphaFile(file) {
    setAlphaFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setAlphaUrl(url)
    } else {
      setAlphaUrl(null)
    }
  }

  async function downloadPreview() {
    if (!captureRef.current) {
      alert('Preview belum siap untuk download')
      return
    }

    try {
      const dataUrl = captureRef.current(1920, 1080) // HD 1080p
      
      // Create download link
      const link = document.createElement('a')
      link.download = `livery_preview_${selectedModel?.name || 'unknown'}_${Date.now()}.png`
      link.href = dataUrl
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('Preview downloaded successfully')
      
    } catch (error) {
      console.error('Error downloading preview:', error)
      alert('Gagal download preview: ' + error.message)
    }
  }

  const isPreviewReady = selectedModel && (bodyUrl || alphaUrl)

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Memuat data...
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-medium mb-6">Testing Livery</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls Panel */}
        <div className="space-y-4">
          <div className="p-4 border rounded bg-white">
            <h3 className="font-semibold mb-4">Pengaturan Livery</h3>
            
            <div className="space-y-4">
              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Pilih Model 3D</label>
                <select 
                  className="w-full p-2 border rounded" 
                  value={selectedModelId} 
                  onChange={e => setSelectedModelId(e.target.value)}
                >
                  <option value="">-- Pilih Model --</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Pose Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Pilih Pose</label>
                <select 
                  className="w-full p-2 border rounded" 
                  value={selectedPoseId} 
                  onChange={e => setSelectedPoseId(e.target.value)}
                  disabled={loadingPoses || !selectedModelId}
                >
                  <option value="">
                    {loadingPoses ? '-- Loading Poses --' : '-- Pilih Pose (Opsional) --'}
                  </option>
                  {poses.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.camera_zoom && ` (${p.camera_zoom.toFixed(1)}x zoom)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Body Texture Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Upload Body Texture</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => handleBodyFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded"
                />
                {bodyFile && (
                  <p className="text-xs text-green-600 mt-1">✓ Body: {bodyFile.name}</p>
                )}
              </div>

              {/* Alpha Texture Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Upload Alpha/Glass Texture</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => handleAlphaFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded"
                />
                {alphaFile && (
                  <p className="text-xs text-green-600 mt-1">✓ Alpha: {alphaFile.name}</p>
                )}
              </div>

              {/* Download Button */}
              {isPreviewReady && !modelLoading && (
                <button 
                  onClick={downloadPreview}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  📥 Download Preview HD (1920x1080)
                </button>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium text-blue-800 mb-2">Cara Menggunakan:</h4>
            <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
              <li>Pilih model 3D dari dropdown</li>
              <li>Upload texture body dan/atau alpha</li>
              <li>Pilih pose untuk positioning (opsional)</li>
              <li>Preview akan muncul secara real-time</li>
              <li>Gunakan mouse untuk adjusting camera (drag, scroll)</li>
              <li>Klik "Download Preview HD" untuk mendapat hasil 1080p</li>
            </ol>
          </div>

          {/* Status Info */}
          {isPreviewReady && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                ✓ Preview siap! Model: <strong>{selectedModel.name}</strong>
                {selectedPose && (
                  <span> | Pose: <strong>{selectedPose.name}</strong></span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Preview 3D (16:9)</h3>
            {isPreviewReady && !modelLoading && (
              <span className="text-xs text-gray-500">
                Preview: 16:9 | Download: 1920x1080
              </span>
            )}
          </div>
          
          <LoadingOverlay
            isVisible={modelLoading || loadingPoses}
            progress={modelLoading ? loadingProgress : 0}
            message={modelLoading ? loadingMessage : (loadingPoses ? 'Loading poses...' : '')}
          >
            <div className="border rounded bg-gray-50" style={{ width: '100%', aspectRatio: '16/9' }}>
              {selectedModel && isPreviewReady ? (
                <Canvas 
                  camera={{ 
                    position: selectedPose ? [selectedPose.camera_pos.x, selectedPose.camera_pos.y, selectedPose.camera_pos.z] : [5, 2, 5], 
                    fov: selectedPose ? Math.max(5, selectedPose.camera_fov || 45) : 45 
                  }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <ambientLight intensity={0.6} />
                  <directionalLight position={[5, 10, 5]} intensity={1} />
                  <directionalLight position={[-3, 3, -3]} intensity={0.4} />
                  
                  <BusModel 
                    glbUrl={selectedModel.glb_url}
                    bodyUrl={bodyUrl}
                    alphaUrl={alphaUrl}
                    poseData={selectedPose}
                  />
                  
                  <OrbitControls enablePan enableZoom enableRotate />
                  <CaptureHelper onReady={(captureFunc) => { captureRef.current = captureFunc }} />
                </Canvas>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  {modelError ? (
                    <div className="text-red-500 text-center">
                      <div>Error loading model</div>
                      <div className="text-xs">{modelError}</div>
                    </div>
                  ) : selectedModel ? (
                    'Upload texture untuk melihat preview'
                  ) : (
                    'Pilih model dan upload texture'
                  )}
                </div>
              )}
            </div>
          </LoadingOverlay>

          <div className="mt-4 p-3 bg-gray-50 rounded">
            <h4 className="font-medium text-sm mb-2">Tips Preview:</h4>
            <ul className="text-xs text-gray-700 list-disc list-inside space-y-1">
              <li>Drag mouse untuk rotate kamera</li>
              <li>Scroll untuk zoom in/out</li>
              <li>Drag kanan untuk pan kamera</li>
              <li>Download akan menghasilkan gambar 1920x1080 HD</li>
              <li>Gunakan pose yang sudah disimpan untuk hasil konsisten</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}