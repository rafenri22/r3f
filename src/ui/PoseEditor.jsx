import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { supabase } from '../lib/supabase'

function ModelPreview({ url }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

function CameraGetter({ onGet }) {
  const { camera } = useThree()
  
  useEffect(() => { 
    if (onGet) onGet(camera) 
  }, [camera, onGet])
  
  return null
}

export default function PoseEditor({ models }) {
  const [modelId, setModelId] = useState('')
  const [modelUrl, setModelUrl] = useState(null)
  const [poses, setPoses] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const cameraRef = useRef(null)

  useEffect(() => { 
    if (modelId) loadModelUrl() 
  }, [modelId])

  async function loadModelUrl() {
    try {
      const m = models.find(x => x.id === modelId)
      setModelUrl(m?.glb_url || null)
      
      const { data } = await supabase.from('poses').select('*').eq('model_id', modelId)
      setPoses(data || [])
    } catch (error) {
      console.error('Error loading model:', error)
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
        target_pos: target 
      })
      
      if (error) throw error
      
      alert('Pose berhasil disimpan!')
      setName('')
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

  return (
    <div className="p-4 border rounded bg-white">
      <h3 className="font-semibold mb-3">Pose Editor</h3>
      
      <div className="mb-3">
        <select 
          className="p-2 border rounded w-full" 
          value={modelId} 
          onChange={e => setModelId(e.target.value)}
        >
          <option value="">-- Pilih Model --</option>
          {models.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div style={{ height: 360 }} className="mb-3 border rounded">
        {modelUrl ? (
          <Canvas camera={{ position: [5, 2, 5], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1} />
            <ModelPreview url={modelUrl} />
            <OrbitControls />
            <CameraGetter onGet={(cam) => { cameraRef.current = cam }} />
          </Canvas>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Pilih model untuk load preview
          </div>
        )}
      </div>

      <div className="space-y-3">
        <input 
          className="w-full p-2 border rounded" 
          placeholder="Nama pose" 
          value={name} 
          onChange={e => setName(e.target.value)} 
        />
        
        <button 
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50" 
          onClick={savePose}
          disabled={loading}
        >
          {loading ? 'Menyimpan...' : 'Simpan Pose (Ambil Posisi Kamera)'}
        </button>
      </div>

      <div className="mt-6">
        <h4 className="font-medium mb-3">Pose untuk Model Ini</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {poses.map(p => (
            <div key={p.id} className="p-3 border rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-500">
                  Camera: ({p.camera_pos.x.toFixed(1)}, {p.camera_pos.y.toFixed(1)}, {p.camera_pos.z.toFixed(1)})
                </div>
              </div>
              <button 
                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => deletePose(p.id)}
              >
                Hapus
              </button>
            </div>
          ))}
          
          {poses.length === 0 && (
            <div className="text-gray-500 text-sm text-center py-4">
              Belum ada pose untuk model ini
            </div>
          )}
        </div>
      </div>
    </div>
  )
}