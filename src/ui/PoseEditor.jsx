import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { supabase } from '../lib/supabase'

function ModelPreview({ url, onReady }){
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

function CameraGetter({ onGet }){
  const { camera } = useThree()
  useEffect(()=>{ if(onGet) onGet(camera) }, [camera])
  return null
}

export default function PoseEditor({ models }){
  const [modelId, setModelId] = useState('')
  const [modelUrl, setModelUrl] = useState(null)
  const [poses, setPoses] = useState([])
  const [name, setName] = useState('')

  useEffect(()=>{ if(modelId) loadModelUrl() }, [modelId])
  async function loadModelUrl(){
    const m = models.find(x=>x.id===modelId)
    setModelUrl(m?.glb_url||null)
    const { data } = await supabase.from('poses').select('*').eq('model_id', modelId)
    setPoses(data||[])
  }

  async function savePose(camera){
    if(!modelId || !name) return alert('pilih model & isi nama pose')
    const camera_pos = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    const target = { x: 0, y: 0, z: 0 }
    const { error } = await supabase.from('poses').insert({ model_id: modelId, name, camera_pos, target_pos: target })
    if(error) return alert('gagal simpan: '+error.message)
    alert('pose disimpan')
    setName('')
    loadModelUrl()
  }

  return (
    <div className="p-4 border rounded bg-white">
      <h3 className="font-semibold mb-3">Pose Editor</h3>
      <div className="mb-2">
        <select className="p-2 border rounded w-full" value={modelId} onChange={e=>setModelId(e.target.value)}>
          <option value="">-- pilih model --</option>
          {models.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div style={{height: 360}} className="mb-2 border">
        {modelUrl? (
          <Canvas camera={{ position: [5,2,5], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5,10,5]} />
            <ModelPreview url={modelUrl} />
            <OrbitControls />
            <CameraGetter onGet={(cam)=> window._tja_cached_camera = cam} />
          </Canvas>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">Pilih model untuk load preview</div>
        )}
      </div>

      <input className="w-full p-2 border rounded mb-2" placeholder="Nama pose" value={name} onChange={e=>setName(e.target.value)} />
      <div className="flex gap-2">
        <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={()=> savePose(window._tja_cached_camera)}>Simpan Pose (ambil posisi kamera sekarang)</button>
      </div>

      <div className="mt-4">
        <h4 className="font-medium mb-2">Pose untuk model</h4>
        <div className="space-y-2">
          {poses.map(p=> (
            <div key={p.id} className="p-2 border rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-500">cam: {JSON.stringify(p.camera_pos)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}