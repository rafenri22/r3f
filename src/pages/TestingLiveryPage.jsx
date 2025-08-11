import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { supabase } from '../lib/supabase'
import { useModel3DLoader } from '../hooks/useModel3DLoader'
import { addWatermark } from '../utils/watermark'
import LoadingOverlay from '../components/LoadingOverlay'
import { Download, Upload, Image as ImageIcon, Camera, Settings, Monitor } from 'lucide-react'

function BusModel({ glbUrl, bodyUrl, alphaUrl, zoom, fov }) {
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

  // Apply manual camera settings
  useEffect(() => {
    if (camera) {
      // Set FOV
      camera.fov = Math.max(5, Math.min(120, fov))
      
      // Apply zoom by adjusting camera distance
      const baseDistance = 8
      const targetDistance = baseDistance / zoom
      const direction = camera.position.clone().normalize()
      const newPosition = direction.multiplyScalar(targetDistance)
      camera.position.copy(newPosition)
      
      camera.updateProjectionMatrix()
    }
  }, [camera, zoom, fov])

  return <primitive object={scene} />
}

function CaptureHelper({ onReady }) {
  const { gl, scene, camera } = useThree()
  
  const captureScreenshot = useCallback((width = 1920, height = 1080) => {
    // Store original settings
    const originalSize = gl.getSize(new THREE.Vector2())
    const originalPixelRatio = gl.getPixelRatio()
    
    // Set high quality render settings
    gl.setPixelRatio(1)
    gl.setSize(width, height, false)
    
    // Update camera aspect ratio
    const originalAspect = camera.aspect
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    
    // Clear and render
    gl.clear()
    gl.render(scene, camera)
    
    // Get the rendered canvas
    const canvas = gl.domElement
    
    // Restore original settings
    gl.setPixelRatio(originalPixelRatio)
    gl.setSize(originalSize.x, originalSize.y, false)
    camera.aspect = originalAspect
    camera.updateProjectionMatrix()
    
    return canvas
  }, [gl, scene, camera])

  useEffect(() => {
    onReady(captureScreenshot)
  }, [captureScreenshot, onReady])

  return null
}

export default function TestingLiveryPage() {
  const [models, setModels] = useState([])
  const [selectedModelId, setSelectedModelId] = useState('')
  const [bodyFile, setBodyFile] = useState(null)
  const [alphaFile, setAlphaFile] = useState(null)
  const [bodyUrl, setBodyUrl] = useState(null)
  const [alphaUrl, setAlphaUrl] = useState(null)
  const [zoom, setZoom] = useState(1.0)
  const [fov, setFov] = useState(45)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const captureRef = useRef(null)

  const selectedModel = models.find(m => m.id === selectedModelId)
  
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
      setDownloading(true)
      
      // Capture the canvas
      const canvas = captureRef.current(1920, 1080)
      
      // Add watermark
      const watermarkedDataUrl = await addWatermark(canvas, 1920, 1080)
      
      // Create download link
      const link = document.createElement('a')
      link.download = `livery_preview_${selectedModel?.name?.replace(/\s+/g, '_') || 'unknown'}_${Date.now()}.png`
      link.href = watermarkedDataUrl
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('Preview downloaded successfully')
      
    } catch (error) {
      console.error('Error downloading preview:', error)
      alert('Gagal download preview: ' + error.message)
    } finally {
      setDownloading(false)
    }
  }

  const isPreviewReady = selectedModel && (bodyUrl || alphaUrl)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Testing Livery</h1>
          <p className="text-slate-600">Preview dan unduh desain livery dengan kualitas HD</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Model Selection Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Pilih Model</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Model 3D</label>
                <select 
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all" 
                  value={selectedModelId} 
                  onChange={e => setSelectedModelId(e.target.value)}
                >
                  <option value="">-- Pilih Model Bus --</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Texture Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Upload Texture</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Body Texture</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleBodyFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="body-upload"
                    />
                    <label 
                      htmlFor="body-upload"
                      className="w-full p-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all flex items-center justify-center space-x-2 text-slate-600 hover:text-slate-700"
                    >
                      <Upload className="w-5 h-5" />
                      <span>{bodyFile ? bodyFile.name : 'Pilih file body texture'}</span>
                    </label>
                  </div>
                  {bodyFile && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      Body texture dimuat
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Alpha/Glass Texture</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleAlphaFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="alpha-upload"
                    />
                    <label 
                      htmlFor="alpha-upload"
                      className="w-full p-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all flex items-center justify-center space-x-2 text-slate-600 hover:text-slate-700"
                    >
                      <Upload className="w-5 h-5" />
                      <span>{alphaFile ? alphaFile.name : 'Pilih file alpha texture'}</span>
                    </label>
                  </div>
                  {alphaFile && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      Alpha texture dimuat
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Camera Controls Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Camera className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Pengaturan Kamera</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Zoom Level</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.1"
                      value={zoom}
                      onChange={e => setZoom(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12 text-slate-600">{zoom.toFixed(1)}x</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Field of View</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="15"
                      max="90"
                      step="1"
                      value={fov}
                      onChange={e => setFov(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12 text-slate-600">{fov}°</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-2 sm:space-y-0">
                <h3 className="text-lg font-semibold text-slate-900">Preview 3D</h3>
                {isPreviewReady && !modelLoading && (
                  <button 
                    onClick={downloadPreview}
                    disabled={downloading}
                    className="bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center space-x-2"
                  >
                    {downloading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{downloading ? 'Memproses...' : 'Download HD'}</span>
                  </button>
                )}
              </div>
              
              <LoadingOverlay
                isVisible={modelLoading}
                progress={modelLoading ? loadingProgress : 0}
                message={modelLoading ? loadingMessage : ''}
              >
                <div className="border border-slate-200 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden" style={{ width: '100%', aspectRatio: '16/9' }}>
                  {selectedModel && isPreviewReady ? (
                    <Canvas 
                      camera={{ position: [5, 2, 5], fov: Math.max(1, Math.min(90, fov)) }}
                      style={{ width: '100%', height: '100%' }}
                    >
                      {/* Enhanced lighting for better visibility */}
                      <ambientLight intensity={0.4} />
                      <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
                      <directionalLight position={[-5, 5, -5]} intensity={0.6} />
                      <directionalLight position={[0, -5, 5]} intensity={0.3} />
                      
                      {/* Subtle environment lighting */}
                      <hemisphereLight skyColor="#87CEEB" groundColor="#2F4F4F" intensity={0.3} />
                      
                      <BusModel 
                        glbUrl={selectedModel.glb_url}
                        bodyUrl={bodyUrl}
                        alphaUrl={alphaUrl}
                        zoom={zoom}
                        fov={fov}
                      />
                      
                      <OrbitControls enablePan enableZoom enableRotate />
                      <CaptureHelper onReady={(captureFunc) => { captureRef.current = captureFunc }} />
                    </Canvas>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      {modelError ? (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <span className="text-red-600 text-xl">⚠</span>
                          </div>
                          <div className="text-red-600 font-medium">Error loading model</div>
                          <div className="text-xs text-red-500 mt-1">{modelError}</div>
                        </div>
                      ) : selectedModel ? (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <ImageIcon className="w-6 h-6 text-slate-400" />
                          </div>
                          <div>Upload texture untuk melihat preview</div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Monitor className="w-6 h-6 text-slate-400" />
                          </div>
                          <div>Pilih model dan upload texture</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </LoadingOverlay>

              {/* Preview Controls Info */}
              <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-sm text-slate-700 mb-2">Kontrol Preview:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    <span>Drag: Rotasi kamera</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    <span>Scroll: Zoom in/out</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    <span>Drag kanan: Pan</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    💡 Download menghasilkan gambar 1920x1080 HD dengan watermark perusahaan
                  </p>
                </div>
              </div>

              {/* Status Card */}
              {isPreviewReady && (
                <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Camera className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-900">Preview Siap!</h4>
                      <p className="text-sm text-emerald-700">
                        Model: <strong>{selectedModel.name}</strong>
                        <span> • Zoom: <strong>{zoom.toFixed(1)}x</strong></span>
                        <span> • FOV: <strong>{fov}°</strong></span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}