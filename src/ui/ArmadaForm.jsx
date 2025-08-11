import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function BusPreview({ glbUrl, bodyUrl, alphaUrl, pose }) {
  const { scene } = useGLTF(glbUrl)
  
  useEffect(() => {
    if (!scene) return
    
    // Apply textures if provided
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Apply body texture
        if (bodyUrl && child.material.name === 'bodybasic') {
          const loader = new THREE.TextureLoader()
          loader.load(bodyUrl, (texture) => {
            child.material.map = texture
            child.material.needsUpdate = true
          })
        }
        
        // Apply alpha texture
        if (alphaUrl && child.material.name === 'alpha') {
          const loader = new THREE.TextureLoader()
          loader.load(alphaUrl, (texture) => {
            child.material.map = texture
            child.material.needsUpdate = true
          })
        }
      }
    })
  }, [scene, bodyUrl, alphaUrl])

  return <primitive object={scene} />
}

export default function ArmadaForm({ models }) {
  const [kode, setKode] = useState('')
  const [nickname, setNickname] = useState('')
  const [crew, setCrew] = useState('')
  const [modelId, setModelId] = useState('')
  const [poses, setPoses] = useState([])
  const [poseId, setPoseId] = useState('')
  const [bodyFile, setBodyFile] = useState(null)
  const [alphaFile, setAlphaFile] = useState(null)
  const [previewModelUrl, setPreviewModelUrl] = useState(null)
  const [previewBodyUrl, setPreviewBodyUrl] = useState(null)
  const [previewAlphaUrl, setPreviewAlphaUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { 
    if (modelId) loadPoses() 
  }, [modelId])

  async function loadPoses() {
    try {
      const { data } = await supabase.from('poses').select('*').eq('model_id', modelId)
      setPoses(data || [])
      const m = models.find(x => x.id === modelId)
      setPreviewModelUrl(m?.glb_url || null)
    } catch (error) {
      console.error('Error loading poses:', error)
    }
  }

  function fileToUrl(file) { 
    return file ? URL.createObjectURL(file) : null 
  }

  async function submit() {
    if (!kode || !modelId || !bodyFile || !alphaFile) {
      return alert('Lengkapi semua data yang diperlukan')
    }
    
    setLoading(true)
    try {
      // Upload liveries
      const ts = Date.now()
      const bodyKey = `liveries/${kode}_${ts}_body_${bodyFile.name}`
      const alphaKey = `liveries/${kode}_${ts}_alpha_${alphaFile.name}`
      
      await supabase.storage.from('liveries').upload(bodyKey, bodyFile)
      await supabase.storage.from('liveries').upload(alphaKey, alphaFile)
      
      const bodyUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/liveries/${encodeURIComponent(bodyKey)}`
      const alphaUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/liveries/${encodeURIComponent(alphaKey)}`
      
      // Insert armada row
      const { error } = await supabase.from('armada').insert({ 
        kode_bus: kode, 
        nickname, 
        crew, 
        model_id: modelId, 
        pose_id: poseId || null, 
        livery_body_url: bodyUrl, 
        livery_alpha_url: alphaUrl 
      })
      
      if (error) throw error
      
      alert('Armada berhasil ditambahkan!')
      
      // Reset form
      setKode('')
      setNickname('')
      setCrew('')
      setModelId('')
      setPoseId('')
      setBodyFile(null)
      setAlphaFile(null)
      setPreviewModelUrl(null)
      setPreviewBodyUrl(null)
      setPreviewAlphaUrl(null)
      
    } catch (e) { 
      console.error(e)
      alert('Gagal menambahkan armada: ' + e.message) 
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="p-4 border rounded bg-white">
        <h3 className="font-semibold mb-4">Tambah Armada</h3>
        
        <div className="space-y-3">
          <input 
            className="w-full p-2 border rounded" 
            placeholder="Kode bus (TJA-001)" 
            value={kode} 
            onChange={e => setKode(e.target.value)} 
          />
          
          <input 
            className="w-full p-2 border rounded" 
            placeholder="Nickname" 
            value={nickname} 
            onChange={e => setNickname(e.target.value)} 
          />
          
          <input 
            className="w-full p-2 border rounded" 
            placeholder="Crew" 
            value={crew} 
            onChange={e => setCrew(e.target.value)} 
          />
          
          <select 
            className="w-full p-2 border rounded" 
            value={modelId} 
            onChange={e => setModelId(e.target.value)}
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
          >
            <option value="">-- Pilih Pose (Opsional) --</option>
            {poses.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <div>
            <label className="block text-sm font-medium mb-1">Upload Body Texture (PNG)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => { 
                const file = e.target.files?.[0] || null
                setBodyFile(file)
                setPreviewBodyUrl(fileToUrl(file))
              }} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Upload Alpha Texture (PNG)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => { 
                const file = e.target.files?.[0] || null
                setAlphaFile(file)
                setPreviewAlphaUrl(fileToUrl(file))
              }} 
            />
          </div>

          <button 
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" 
            onClick={submit} 
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Simpan Armada'}
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Setelah simpan, gunakan preview untuk mengambil screenshot thumbnail secara manual.
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Preview 3D</h3>
        <div className="border rounded" style={{ height: 420 }}>
          {previewModelUrl ? (
            <Canvas camera={{ position: [5, 2, 5], fov: 45 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 5]} intensity={1} />
              <BusPreview 
                glbUrl={previewModelUrl}
                bodyUrl={previewBodyUrl}
                alphaUrl={previewAlphaUrl}
                pose={poseId}
              />
              <OrbitControls />
            </Canvas>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Pilih model untuk melihat preview
            </div>
          )}
        </div>
        
        {previewBodyUrl && (
          <div className="mt-2 text-sm text-green-600">
            ✓ Body texture loaded
          </div>
        )}
        
        {previewAlphaUrl && (
          <div className="mt-1 text-sm text-green-600">
            ✓ Alpha texture loaded
          </div>
        )}
      </div>
    </div>
  )
}