import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { supabase } from '../lib/supabase'
import { useModel3DLoader } from '../hooks/useModel3DLoader'
import LoadingOverlay from '../components/LoadingOverlay'

function ModelPreview({ url }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

function CameraController({ onGet, zoom, fov }) {
  const { camera, controls } = useThree()
  
  useEffect(() => { 
    if (onGet) onGet(camera) 
  }, [camera, onGet])

  useEffect(() => {
    if (camera && fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  }, [camera, fov])

  useEffect(() => {
    if (controls && zoom) {
      controls.setDistance = (distance) => {
        const scaledDistance = distance / zoom
        controls.dollyTo(scaledDistance, true)
      }
    }
  }, [controls, zoom])
  
  return null
}

export default function PoseEditor({ models }) {
  const [modelId, setModelId] = useState('')
  const [modelUrl, setModelUrl] = useState(null)
  const [poses, setPoses] = useState([])
  const [name, setName] = useState('')
  const [zoom, setZoom] = useState(1.0)
  const [fov, setFov] = useState(45)
  const [loading, setLoading] = useState(false)
  const [loadingPoses, setLoadingPoses] = useState(false)
  const cameraRef = useRef(null)

  // Use 3D model loader with progress
  const { 
    loadingProgress, 
    isLoading: modelLoading, 
    loadingMessage,
    error: modelError 
  } = useModel3DLoader(modelUrl)

  useEffect(() => { 
    if (modelId) loadModelUrl() 
  }, [modelId])

  async function loadModelUrl() {
    try {
      setLoadingPoses(true)
      const m = models.find(x => x.id === modelId)
      setModelUrl(m?.glb_url || null)
      
      const { data } = await supabase.from('poses').select('*').eq('model_id', modelId)
      setPoses(data || [])
    } catch (error) {
      console.error('Error loading model:', error)
    } finally {
      setLoadingPoses(false)
    }
  }

  async function savePose() {
    if (!modelId || !name) {
      return alert('Pilih model dan isi nama pose')
    }
    
    if (!cameraRef.current) {
      return alert('Camera tidak tersedia')
    }

    setLoading(true)
    try {
      const camera = cameraRef.current
      const camera_pos = { 
        x: camera.position.x, 
        y: camera.position.y, 
        z: camera.position.z 
      }
      const target = { x: 0, y: 0, z: 0 }
      
      const { error } = await supabase.from('poses').insert({ 
        model_id: modelId, 
        name, 
        camera_pos, 
        target_pos: target,
        camera_zoom: zoom,
        camera_fov: fov
      })
      
      if (error) throw error
      
      alert('Pose berhasil disimpan!')
      setName('')
      setZoom(1.0)
      setFov(45)
      loadModelUrl()
      
    } catch (error) {
      console.error('Error saving pose:', error)
      alert('Gagal menyimpan pose: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function deletePose(poseId) {
    if (!confirm('Hapus pose ini?')) return
    
    try {
      const { error } = await supabase.from('poses').delete().eq('id', poseId)
      if (error) throw error
      
      alert('Pose berhasil dihapus!')
      loadModelUrl()
    } catch (error) {
      console.error('Error deleting pose:', error)
      alert('Gagal menghapus pose: ' + error.message)
    }
  }

  function loadPose(pose) {
    setZoom(pose.camera_zoom || 1.0)
    setFov(pose.camera_fov || 45)
    
    if (cameraRef.current && pose.camera_pos) {
      cameraRef.current.position.set(
        pose.camera_pos.x, 
        pose.camera_pos.y, 
        pose.camera_pos.z
      )
      cameraRef.current.lookAt(
        pose.target_pos?.x || 0,
        pose.target_pos?.y || 0,
        pose.target_pos?.z || 0
      )
      cameraRef.current.updateProjectionMatrix()
    }
  }

  return (
    <div className="p-4 border rounded bg-white">
      <h3 className="font-semibold mb-3">Pose Editor</h3>
      
      <div className="mb-3">
        <select 
          className="p-2 border rounded w-full" 
          value={modelId} 
          onChange={e => setModelId(e.target.value)}
          disabled={loadingPoses}
        >
          <option value="">{loadingPoses ? '-- Loading Models --' : '-- Pilih Model --'}</option>
          {models.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Camera Controls */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <h4 className="font-medium mb-2 text-sm">Camera Controls</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Zoom Level</label>
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
              <span className="text-xs font-mono w-8">{zoom.toFixed(1)}x</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Field of View</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="20"
                max="120"
                step="1"
                value={fov}
                onChange={e => setFov(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs font-mono w-8">{fov}°</span>
            </div>
          </div>
        </div>
      </div>

      <LoadingOverlay
        isVisible={modelLoading || loadingPoses}
        progress={loadingProgress}
        message={loadingMessage || (loadingPoses ? 'Loading poses...' : '')}
      >
        <div style={{ height: 360 }} className="mb-3 border rounded">
          {modelUrl ? (
            <Canvas camera={{ position: [5, 2, 5], fov: fov }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 5]} intensity={1} />
              <ModelPreview url={modelUrl} />
              <OrbitControls />
              <CameraController 
                onGet={(cam) => { cameraRef.current = cam }} 
                zoom={zoom}
                fov={fov}
              />
            </Canvas>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {modelError ? (
                <div className="text-red-500 text-center">
                  <div>Error loading model</div>
                  <div className="text-xs">{modelError}</div>
                </div>
              ) : (
                'Pilih model untuk load preview'
              )}
            </div>
          )}
        </div>
      </LoadingOverlay>

      <div className="space-y-3">
        <input 
          className="w-full p-2 border rounded" 
          placeholder="Nama pose" 
          value={name} 
          onChange={e => setName(e.target.value)}
          disabled={loading}
        />
        
        <button 
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50" 
          onClick={savePose}
          disabled={loading || modelLoading}
        >
          {loading ? 'Menyimpan...' : 'Simpan Pose (Ambil Posisi Kamera)'}
        </button>
      </div>

      <div className="mt-6">
        <h4 className="font-medium mb-3">Pose untuk Model Ini</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {poses.map(p => (
            <div key={p.id} className="p-3 border rounded flex justify-between items-center">
              <div className="flex-1">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-500">
                  Pos: ({p.camera_pos.x.toFixed(1)}, {p.camera_pos.y.toFixed(1)}, {p.camera_pos.z.toFixed(1)})
                  {p.camera_zoom && ` | Zoom: ${p.camera_zoom.toFixed(1)}x`}
                  {p.camera_fov && ` | FOV: ${p.camera_fov}°`}
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => loadPose(p)}
                >
                  Load
                </button>
                <button 
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => deletePose(p.id)}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
          
          {poses.length === 0 && !loadingPoses && (
            <div className="text-gray-500 text-sm text-center py-4">
              Belum ada pose untuk model ini
            </div>
          )}
        </div>
      </div>
    </div>
  )
}