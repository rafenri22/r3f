import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { supabase } from '../lib/supabase'
import { useModel3DLoader } from '../hooks/useModel3DLoader'
import { addWatermark } from '../utils/watermark'
import LoadingOverlay from '../components/LoadingOverlay'
import LoadingProgress from '../components/LoadingProgress'
import { Download, Upload, Image as ImageIcon, Camera, Settings, Monitor } from 'lucide-react'

function BusModel({ glbUrl, bodyUrl, alphaUrl, zoom, fov }) {
  const { scene } = useGLTF(glbUrl)
  const { camera } = useThree()
  
  // Apply textures with proper UV mapping
  useEffect(() => {
    if (!scene) return
    
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Apply body texture with proper UV settings
        if (bodyUrl && (child.material.name === 'bodybasic' || child.material.name?.toLowerCase().includes('body'))) {
          const loader = new THREE.TextureLoader()
          loader.load(bodyUrl, (texture) => {
            // Preserve original UV mapping
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.flipY = false // Important: keep original orientation
            texture.generateMipmaps = true
            texture.minFilter = THREE.LinearMipmapLinearFilter
            texture.magFilter = THREE.LinearFilter
            
            // Don't modify repeat or offset - use original UV coordinates
            // texture.repeat.set(1, 1)
            // texture.offset.set(0, 0)
            
            // Apply texture to material
            if (child.material.map) {
              child.material.map.dispose() // Clean up old texture
            }
            child.material.map = texture
            child.material.needsUpdate = true
            
            console.log('Body texture applied to:', child.material.name, 'UV coords preserved')
          })
        }
        
        // Apply alpha texture with proper UV settings
        if (alphaUrl && (child.material.name === 'alpha' || child.material.name?.toLowerCase().includes('alpha') || child.material.name?.toLowerCase().includes('glass'))) {
          const loader = new THREE.TextureLoader()
          loader.load(alphaUrl, (texture) => {
            // Preserve original UV mapping for alpha
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.flipY = false // Keep original orientation
            texture.generateMipmaps = true
            texture.minFilter = THREE.LinearMipmapLinearFilter
            texture.magFilter = THREE.LinearFilter
            
            // Apply texture to material
            if (child.material.map) {
              child.material.map.dispose() // Clean up old texture
            }
            child.material.map = texture
            child.material.transparent = true
            child.material.alphaTest = 0.1 // Better alpha handling
            child.material.needsUpdate = true
            
            console.log('Alpha texture applied to:', child.material.name, 'UV coords preserved')
          })
        }
      }
    })
  }, [scene, bodyUrl, alphaUrl])

  // Apply manual camera settings
  useEffect(() => {
    if (camera) {
      // Set FOV (minimum 1 degree)
      camera.fov = Math.max(1, Math.min(120, fov))
      
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
  
  const captureScreenshot = useCallback(async (width = 1920, height = 1080) => {
    // Store original settings
    const originalSize = gl.getSize(new THREE.Vector2())
    const originalPixelRatio = gl.getPixelRatio()
    const originalAspect = camera.aspect
    
    // Set high quality render settings
    gl.setPixelRatio(1)
    gl.setSize(width, height, false)
    
    // Update camera aspect ratio
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    
    // Clear and render with proper timing
    gl.setClearColor(0x0f172a, 1); // Warna slate-900
    gl.clear()
    gl.render(scene, camera)
    
    // Wait a frame to ensure render is complete
    await new Promise(resolve => requestAnimationFrame(resolve))
    
    // Create a new canvas to capture the rendered content
    const captureCanvas = document.createElement('canvas')
    captureCanvas.width = width
    captureCanvas.height = height
    const captureCtx = captureCanvas.getContext('2d')
    
    // Draw the WebGL canvas to our capture canvas
    captureCtx.drawImage(gl.domElement, 0, 0, width, height)
    
    // Restore original settings
    gl.setPixelRatio(originalPixelRatio)
    gl.setSize(originalSize.x, originalSize.y, false)
    camera.aspect = originalAspect
    camera.updateProjectionMatrix()
    
    return captureCanvas
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
  
  // Progress states for texture loading
  const [bodyLoading, setBodyLoading] = useState(false)
  const [alphaLoading, setAlphaLoading] = useState(false)
  const [bodyProgress, setBodyProgress] = useState(0)
  const [alphaProgress, setAlphaProgress] = useState(0)
  
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
      setBodyLoading(true)
      setBodyProgress(0)
      
      // Simulate loading progress for file reading
      const reader = new FileReader()
      let progressInterval = setInterval(() => {
        setBodyProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 20
        })
      }, 100)
      
      reader.onload = () => {
        setBodyProgress(100)
        const url = URL.createObjectURL(file)
        setBodyUrl(url)
        
        setTimeout(() => {
          setBodyLoading(false)
          setBodyProgress(0)
        }, 500)
        
        clearInterval(progressInterval)
      }
      
      reader.readAsDataURL(file)
    } else {
      setBodyUrl(null)
      setBodyLoading(false)
      setBodyProgress(0)
    }
  }

  function handleAlphaFile(file) {
    setAlphaFile(file)
    if (file) {
      setAlphaLoading(true)
      setAlphaProgress(0)
      
      // Simulate loading progress for file reading
      const reader = new FileReader()
      let progressInterval = setInterval(() => {
        setAlphaProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 20
        })
      }, 100)
      
      reader.onload = () => {
        setAlphaProgress(100)
        const url = URL.createObjectURL(file)
        setAlphaUrl(url)
        
        setTimeout(() => {
          setAlphaLoading(false)
          setAlphaProgress(0)
        }, 500)
        
        clearInterval(progressInterval)
      }
      
      reader.readAsDataURL(file)
    } else {
      setAlphaUrl(null)
      setAlphaLoading(false)
      setAlphaProgress(0)
    }
  }

  async function downloadPreview() {
    if (!captureRef.current) {
      alert('Preview belum siap untuk download')
      return
    }

    try {
      setDownloading(true)
      
      // Capture the canvas with high resolution
      const canvas = await captureRef.current(1920, 1080)
      
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
  const isTextureLoading = bodyLoading || alphaLoading

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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Testing Livery</h1>
          <p className="text-sm sm:text-base text-slate-600">Preview dan unduh desain livery armada TJA</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-4 sm:space-y-6">
            {/* Model Selection Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Pilih Model</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Model 3D</label>
                <select 
                  className="w-full p-2.5 sm:p-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all text-sm sm:text-base" 
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Upload Texture</h3>
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
                      className="w-full p-2.5 sm:p-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all flex items-center justify-center space-x-2 text-slate-600 hover:text-slate-700 text-sm"
                    >
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="truncate">{bodyFile ? bodyFile.name : 'Pilih file body texture'}</span>
                    </label>
                  </div>
                  
                  {/* Body loading progress */}
                  {bodyLoading && (
                    <div className="mt-2">
                      <LoadingProgress progress={bodyProgress} message="Loading body texture..." />
                    </div>
                  )}
                  
                  {bodyFile && !bodyLoading && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 flex-shrink-0"></span>
                      <span className="truncate">Body texture dimuat</span>
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
                      className="w-full p-2.5 sm:p-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all flex items-center justify-center space-x-2 text-slate-600 hover:text-slate-700 text-sm"
                    >
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="truncate">{alphaFile ? alphaFile.name : 'Pilih file alpha texture'}</span>
                    </label>
                  </div>
                  
                  {/* Alpha loading progress */}
                  {alphaLoading && (
                    <div className="mt-2">
                      <LoadingProgress progress={alphaProgress} message="Loading alpha texture..." />
                    </div>
                  )}
                  
                  {alphaFile && !alphaLoading && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 flex-shrink-0"></span>
                      <span className="truncate">Alpha texture dimuat</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Camera Controls Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Pengaturan Kamera</h3>
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
                      min="1"
                      max="90"
                      step="1"
                      value={fov}
                      onChange={e => setFov(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12 text-slate-600">{fov}°</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">FOV rendah = zoom tele, FOV tinggi = wide angle</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Preview 3D</h3>
                {isPreviewReady && !modelLoading && !isTextureLoading && (
                  <button 
                    onClick={downloadPreview}
                    disabled={downloading}
                    className="w-full sm:w-auto bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 text-white font-semibold px-4 sm:px-6 py-2.5 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    {downloading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{downloading ? 'Memproses...' : 'Download'}</span>
                  </button>
                )}
              </div>
              
              <LoadingOverlay
                isVisible={modelLoading || isTextureLoading}
                progress={modelLoading ? loadingProgress : (bodyLoading ? bodyProgress : alphaProgress)}
                message={modelLoading ? loadingMessage : (bodyLoading ? 'Loading body texture...' : alphaLoading ? 'Loading alpha texture...' : '')}
              >
                <div className="border border-slate-200 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden" style={{ width: '100%', aspectRatio: '16/9' }}>
                  {selectedModel && isPreviewReady && !isTextureLoading ? (
                    <Canvas 
                      camera={{ position: [5, 2, 5], fov: Math.max(1, Math.min(90, fov)) }}
                      style={{ width: '100%', height: '100%' }}
                      gl={{ 
                        preserveDrawingBuffer: true,
                        antialias: true,
                        alpha: true,
                        powerPreference: "high-performance"
                      }}
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
                        <div className="text-center p-4">
                          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <span className="text-red-600 text-xl">⚠</span>
                          </div>
                          <div className="text-red-600 font-medium">Error loading model</div>
                          <div className="text-xs text-red-500 mt-1">{modelError}</div>
                        </div>
                      ) : selectedModel ? (
                        <div className="text-center p-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <ImageIcon className="w-6 h-6 text-slate-400" />
                          </div>
                          <div className="text-sm sm:text-base">Upload texture untuk melihat preview</div>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Monitor className="w-6 h-6 text-slate-400" />
                          </div>
                          <div className="text-sm sm:text-base">Pilih model dan upload texture</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </LoadingOverlay>

              {/* Preview Controls Info */}
              <div className="mt-4 p-3 sm:p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-sm text-slate-700 mb-2">Kontrol Preview:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0"></div>
                    <span>Drag/Geser: Rotasi kamera</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0"></div>
                    <span>Scroll/Zoom: Zoom in/out</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0"></div>
                    <span>Drag kanan/Double tap: Geser Kamera</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    💡 Download untuk mendapatkan gambar 1920x1080 HD
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}