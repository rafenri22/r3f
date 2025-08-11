import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useUploadProgress } from '../hooks/useUploadProgress'
import { useModel3DLoader } from '../hooks/useModel3DLoader'
import LoadingProgress from '../components/LoadingProgress'
import LoadingOverlay from '../components/LoadingOverlay'

function BusPreview({ glbUrl, bodyUrl, alphaUrl, pose, poseData }) {
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
      
      // Apply zoom and FOV if available
      if (poseData.camera_fov) {
        camera.fov = Math.max(5, poseData.camera_fov)
      }
      
      camera.updateProjectionMatrix()
    }
  }, [poseData, camera])

  return <primitive object={scene} />
}

function CameraCapture({ onCapture }) {
  const { gl, scene, camera } = useThree()
  
  useEffect(() => {
    if (onCapture) {
      onCapture(() => {
        // Set render size to HD for thumbnail
        const originalSize = gl.getSize(new THREE.Vector2())
        gl.setSize(1920, 1080, false)
        
        // Update camera aspect ratio
        camera.aspect = 1920 / 1080
        camera.updateProjectionMatrix()
        
        // Render the scene to capture screenshot
        gl.render(scene, camera)
        const dataUrl = gl.domElement.toDataURL('image/png')
        
        // Restore original size
        gl.setSize(originalSize.x, originalSize.y, false)
        camera.aspect = originalSize.x / originalSize.y
        camera.updateProjectionMatrix()
        
        return dataUrl
      })
    }
  }, [gl, scene, camera, onCapture])
  
  return null
}

export default function ArmadaForm({ models, onSuccess }) {
  const [kode, setKode] = useState('')
  const [nickname, setNickname] = useState('')
  const [crew, setCrew] = useState('')
  const [division, setDivision] = useState('')
  const [modelId, setModelId] = useState('')
  const [poses, setPoses] = useState([])
  const [poseId, setPoseId] = useState('')
  const [selectedPose, setSelectedPose] = useState(null)
  const [bodyFile, setBodyFile] = useState(null)
  const [alphaFile, setAlphaFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [previewModelUrl, setPreviewModelUrl] = useState(null)
  const [previewBodyUrl, setPreviewBodyUrl] = useState(null)
  const [previewAlphaUrl, setPreviewAlphaUrl] = useState(null)
  const [loadingPoses, setLoadingPoses] = useState(false)
  const captureFunction = useRef(null)

  // Upload progress hook
  const {
    uploadProgress,
    isUploading,
    uploadMessage,
    startUpload,
    updateProgress,
    finishUpload,
    cancelUpload
  } = useUploadProgress()

  // 3D model loading with progress
  const { 
    loadingProgress: modelLoadingProgress, 
    isLoading: modelLoading, 
    loadingMessage: modelLoadingMessage,
    error: modelError 
  } = useModel3DLoader(previewModelUrl)

  useEffect(() => { 
    if (modelId) loadPoses() 
  }, [modelId])

  useEffect(() => {
    if (poseId) {
      const pose = poses.find(p => p.id === poseId)
      setSelectedPose(pose || null)
    } else {
      setSelectedPose(null)
    }
  }, [poseId, poses])

  async function loadPoses() {
    try {
      setLoadingPoses(true)
      const { data } = await supabase.from('poses').select('*').eq('model_id', modelId)
      setPoses(data || [])
      const m = models.find(x => x.id === modelId)
      setPreviewModelUrl(m?.glb_url || null)
    } catch (error) {
      console.error('Error loading poses:', error)
    } finally {
      setLoadingPoses(false)
    }
  }

  function fileToUrl(file) { 
    return file ? URL.createObjectURL(file) : null 
  }

  async function takeScreenshot() {
    if (!captureFunction.current) {
      alert('Preview belum siap untuk screenshot')
      return
    }

    try {
      const dataUrl = captureFunction.current()
      
      // Convert dataURL to blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      
      // Create file from blob
      const fileName = `${kode || 'preview'}_${Date.now()}.png`
      const file = new File([blob], fileName, { type: 'image/png' })
      
      setThumbnailFile(file)
      alert('Screenshot berhasil diambil! File siap untuk diupload.')
      
    } catch (error) {
      console.error('Error taking screenshot:', error)
      alert('Gagal mengambil screenshot: ' + error.message)
    }
  }

  async function uploadFile(bucket, file, key) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          updateProgress(progress, `Uploading ${file.name}...`)
        }
      })
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve()
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`))
        }
      }
      
      xhr.onerror = () => reject(new Error('Network error during upload'))
      
      // Use Supabase storage upload
      supabase.storage
        .from(bucket)
        .upload(key, file)
        .then(({ error }) => {
          if (error) reject(error)
          else resolve()
        })
        .catch(reject)
    })
  }

  async function submit() {
    if (!kode || !modelId || !bodyFile || !alphaFile || !division) {
      return alert('Lengkapi semua data yang diperlukan (kode bus, model, division, body texture, alpha texture)')
    }
    
    try {
      startUpload('Preparing files...')
      
      // Upload liveries with progress tracking
      const ts = Date.now()
      const bodyKey = `liveries/${kode}_${ts}_body_${bodyFile.name}`
      const alphaKey = `liveries/${kode}_${ts}_alpha_${alphaFile.name}`
      
      updateProgress(10, 'Uploading body texture...')
      const { error: bodyError } = await supabase.storage
        .from('liveries')
        .upload(bodyKey, bodyFile)
      
      if (bodyError) throw bodyError
      
      updateProgress(40, 'Uploading alpha texture...')
      const { error: alphaError } = await supabase.storage
        .from('liveries')
        .upload(alphaKey, alphaFile)

      if (alphaError) throw alphaError
      
      const bodyUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/liveries/${encodeURIComponent(bodyKey)}`
      const alphaUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/liveries/${encodeURIComponent(alphaKey)}`
      
      // Upload thumbnail if provided
      let thumbnailUrl = null
      if (thumbnailFile) {
        updateProgress(70, 'Uploading thumbnail...')
        const thumbnailKey = `thumbnails/${kode}_${ts}_thumbnail_${thumbnailFile.name}`
        const { error: thumbnailError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailKey, thumbnailFile)
        
        if (thumbnailError) throw thumbnailError
        
        thumbnailUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/thumbnails/${encodeURIComponent(thumbnailKey)}`
      }
      
      updateProgress(90, 'Saving to database...')
      
      // Insert armada row
      const armadaData = { 
        kode_bus: kode, 
        nickname: nickname || null, 
        crew: crew || null,
        division,
        model_id: modelId, 
        pose_id: poseId || null, 
        livery_body_url: bodyUrl, 
        livery_alpha_url: alphaUrl,
        thumbnail_url: thumbnailUrl
      }

      const { error } = await supabase.from('armada').insert(armadaData)
      
      if (error) throw error
      
      updateProgress(100, 'Armada saved successfully!')
      finishUpload()
      
      alert('Armada berhasil ditambahkan!')
      
      // Reset form
      setKode('')
      setNickname('')
      setCrew('')
      setDivision('')
      setModelId('')
      setPoseId('')
      setSelectedPose(null)
      setBodyFile(null)
      setAlphaFile(null)
      setThumbnailFile(null)
      setPreviewModelUrl(null)
      setPreviewBodyUrl(null)
      setPreviewAlphaUrl(null)
      
      // Clear file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]')
      fileInputs.forEach(input => input.value = '')
      
      if (onSuccess) onSuccess()
      
    } catch (e) { 
      console.error(e)
      cancelUpload()
      alert('Gagal menambahkan armada: ' + e.message) 
    }
  }

  const isPreviewReady = previewModelUrl && (previewBodyUrl || previewAlphaUrl)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-4 border rounded bg-white">
        <h3 className="font-semibold mb-4">Tambah Armada</h3>
        
        {isUploading && (
          <div className="mb-4">
            <LoadingProgress progress={uploadProgress} message={uploadMessage} />
          </div>
        )}
        
        <div className="space-y-3">
          <input 
            className="w-full p-2 border rounded" 
            placeholder="Kode bus (TJA-001)" 
            value={kode} 
            onChange={e => setKode(e.target.value)}
            disabled={isUploading}
          />
          
          <input 
            className="w-full p-2 border rounded" 
            placeholder="Nickname" 
            value={nickname} 
            onChange={e => setNickname(e.target.value)}
            disabled={isUploading}
          />
          
          <input 
            className="w-full p-2 border rounded" 
            placeholder="Crew" 
            value={crew} 
            onChange={e => setCrew(e.target.value)}
            disabled={isUploading}
          />

          <select 
            className="w-full p-2 border rounded" 
            value={division} 
            onChange={e => setDivision(e.target.value)}
            disabled={isUploading}
          >
            <option value="">-- Pilih Division --</option>
            <option value="AKAP">AKAP</option>
            <option value="PARIWISATA">PARIWISATA</option>
          </select>
          
          <select 
            className="w-full p-2 border rounded" 
            value={modelId} 
            onChange={e => setModelId(e.target.value)}
            disabled={isUploading}
          >
            <option value="">-- Pilih Model --</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          
          <select 
            className="w-full p-2 border rounded" 
            value={poseId} 
            onChange={e => setPoseId(e.target.value)}
            disabled={isUploading || loadingPoses}
          >
            <option value="">{loadingPoses ? '-- Loading Poses --' : '-- Pilih Pose (Opsional) --'}</option>
            {poses.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} 
                {p.camera_zoom && ` (${p.camera_zoom.toFixed(1)}x zoom)`}
              </option>
            ))}
          </select>

          <div>
            <label className="block text-sm font-medium mb-1">Upload Body Texture (PNG/JPG)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => { 
                const file = e.target.files?.[0] || null
                setBodyFile(file)
                setPreviewBodyUrl(fileToUrl(file))
              }}
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">Texture untuk body bus</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Upload Alpha/Glass Texture (PNG/JPG)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => { 
                const file = e.target.files?.[0] || null
                setAlphaFile(file)
                setPreviewAlphaUrl(fileToUrl(file))
              }}
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">Texture untuk kaca/alpha channel</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Upload Thumbnail Manual (PNG/JPG) - Opsional</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => { 
                const file = e.target.files?.[0] || null
                setThumbnailFile(file)
              }}
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">Upload gambar thumbnail secara manual, atau gunakan screenshot dari preview 3D</p>
            {thumbnailFile && (
              <p className="text-xs text-green-600 mt-1">✓ Thumbnail file: {thumbnailFile.name}</p>
            )}
          </div>

          <button 
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" 
            onClick={submit} 
            disabled={isUploading}
          >
            {isUploading ? 'Menyimpan...' : 'Simpan Armada'}
          </button>
          
          {isUploading && (
            <button 
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600" 
              onClick={cancelUpload}
            >
              Cancel Upload
            </button>
          )}
        </div>

        {isPreviewReady && !modelLoading && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-800 mb-2">✓ Texture siap. Gunakan preview 3D untuk melihat hasil dan ambil screenshot untuk thumbnail.</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Preview 3D (16:9)</h3>
          {isPreviewReady && !modelLoading && (
            <button 
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              onClick={takeScreenshot}
              disabled={isUploading}
            >
              📸 Screenshot HD
            </button>
          )}
        </div>
        
        <LoadingOverlay
          isVisible={modelLoading || loadingPoses}
          progress={modelLoading ? modelLoadingProgress : 0}
          message={modelLoading ? modelLoadingMessage : (loadingPoses ? 'Loading poses...' : '')}
        >
          <div className="border rounded" style={{ width: '100%', aspectRatio: '16/9' }}>
            {previewModelUrl ? (
              <Canvas 
                camera={{ 
                  position: [5, 2, 5], 
                  fov: selectedPose ? Math.max(5, selectedPose.camera_fov || 45) : 45
                }}
                style={{ width: '100%', height: '100%' }}
              >
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 10, 5]} intensity={1} />
                <directionalLight position={[-3, 3, -3]} intensity={0.4} />
                <BusPreview 
                  glbUrl={previewModelUrl}
                  bodyUrl={previewBodyUrl}
                  alphaUrl={previewAlphaUrl}
                  pose={poseId}
                  poseData={selectedPose}
                />
                <OrbitControls enablePan enableZoom enableRotate />
                <CameraCapture onCapture={(captureFunc) => { captureFunction.current = captureFunc }} />
              </Canvas>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50">
                {modelError ? (
                  <div className="text-red-500 text-center">
                    <div>Error loading model</div>
                    <div className="text-xs">{modelError}</div>
                  </div>
                ) : (
                  'Pilih model untuk melihat preview'
                )}
              </div>
            )}
          </div>
        </LoadingOverlay>
        
        <div className="mt-2 space-y-1 text-xs">
          {previewBodyUrl && (
            <div className="text-green-600">✓ Body texture loaded</div>
          )}
          {previewAlphaUrl && (
            <div className="text-green-600">✓ Alpha texture loaded</div>
          )}
          {selectedPose && (
            <div className="text-blue-600">
              ✓ Pose: {selectedPose.name}
              {selectedPose.camera_zoom && ` (${selectedPose.camera_zoom.toFixed(1)}x zoom)`}
              {selectedPose.camera_fov && ` (${selectedPose.camera_fov}° FOV)`}
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h4 className="font-medium text-sm mb-2">Cara Screenshot HD:</h4>
          <ol className="text-xs text-gray-700 list-decimal list-inside space-y-1">
            <li>Pastikan model dan texture sudah dimuat</li>
            <li>Pilih pose yang sesuai (akan mengatur zoom dan FOV otomatis)</li>
            <li>Atur posisi kamera dengan mouse (drag untuk rotate, scroll untuk zoom)</li>
            <li>Klik tombol "📸 Screenshot HD" untuk ambil gambar 1920x1080</li>
            <li>Screenshot akan otomatis dijadikan thumbnail saat simpan armada</li>
          </ol>
        </div>
      </div>
    </div>
  )
}