import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'

function BusPreview({ glbUrl, bodyUrl, alphaUrl, pose }){
  const { scene } = useGLTF(glbUrl)

  // apply textures if provided
  if(bodyUrl || alphaUrl){
    const THREE = awaitPromiseTHREE()
  }

  return <primitive object={scene} />
}

// small helper to import THREE in non-top-level (workaround for code snippet)
function awaitPromiseTHREE(){
  return new Promise((res) => {
    import('three').then(THREE => res(THREE))
  })
}

export default function ArmadaForm({ models }){
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

  useEffect(()=>{ if(modelId) loadPoses() }, [modelId])
  async function loadPoses(){
    const { data } = await supabase.from('poses').select('*').eq('model_id', modelId)
    setPoses(data||[])
    const m = models.find(x=>x.id===modelId)
    setPreviewModelUrl(m?.glb_url||null)
  }

  function fileToUrl(file){ return file ? URL.createObjectURL(file) : null }

  async function submit(){
    if(!kode || !modelId || !bodyFile || !alphaFile) return alert('lengkapi data')
    try{
      // upload liveries
      const ts = Date.now()
      const bodyKey = `liveries/${kode}_${ts}_body_${bodyFile.name}`
      const alphaKey = `liveries/${kode}_${ts}_alpha_${alphaFile.name}`
      await supabase.storage.from('liveries').upload(bodyKey, bodyFile)
      await supabase.storage.from('liveries').upload(alphaKey, alphaFile)
      const bodyUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/liveries/${encodeURIComponent(bodyKey)}`
      const alphaUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/liveries/${encodeURIComponent(alphaKey)}`
      // insert armada row (thumbnail_url left empty, admin will upload later manually)
      const { error } = await supabase.from('armada').insert({ kode_bus: kode, nickname, crew, model_id: modelId, pose_id: poseId || null, livery_body_url: bodyUrl, livery_alpha_url: alphaUrl })
      if(error) throw error
      alert('Armada ditambahkan. Silakan ambil screenshot dan upload manual ke kolom thumbnail.')
      // reset
      setKode(''); setNickname(''); setCrew(''); setBodyFile(null); setAlphaFile(null)
    }catch(e){ console.error(e); alert('gagal: '+e.message) }
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="p-4 border rounded bg-white">
        <h3 className="font-semibold mb-2">Tambah Armada</h3>
        <input className="w-full p-2 border rounded mb-2" placeholder="Kode bus (TJA-001)" value={kode} onChange={e=>setKode(e.target.value)} />
        <input className="w-full p-2 border rounded mb-2" placeholder="Nickname" value={nickname} onChange={e=>setNickname(e.target.value)} />
        <input className="w-full p-2 border rounded mb-2" placeholder="Crew" value={crew} onChange={e=>setCrew(e.target.value)} />
        <select className="w-full p-2 border rounded mb-2" value={modelId} onChange={e=>setModelId(e.target.value)}>
          <option value="">-- pilih model --</option>
          {models.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className="w-full p-2 border rounded mb-2" value={poseId} onChange={e=>setPoseId(e.target.value)}>
          <option value="">-- pilih pose (opsional) --</option>
          {poses.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <div className="mb-2">
          <label className="block text-sm">Upload body (PNG)</label>
          <input type="file" accept="image/*" onChange={e=>{ setBodyFile(e.target.files?.[0]||null); setPreviewBodyUrl(fileToUrl(e.target.files?.[0]||null)) }} />
        </div>
        <div className="mb-2">
          <label className="block text-sm">Upload alpha (PNG)</label>
          <input type="file" accept="image/*" onChange={e=>{ setAlphaFile(e.target.files?.[0]||null); setPreviewAlphaUrl(fileToUrl(e.target.files?.[0]||null)) }} />
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={submit}>Simpan Armada</button>
        </div>

        <p className="mt-3 text-sm text-gray-600">Setelah simpan, buka entry armada untuk preview penuh dan gunakan tombol "Download Screenshot" untuk buat thumbnail manual, lalu upload ke kolom thumbnail di tabel armada (atau lewat UI upload thumbnail).</p>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Preview</h3>
        <div className="border" style={{height: 420}}>
          {previewModelUrl ? (
            <Canvas camera={{ position: [5,2,5], fov:45 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5,10,5]} />
              {/* Note: in a real app we would apply textures to materials here. For brevity this preview only loads the glb */}
              <primitive object={null} />
              <OrbitControls />
            </Canvas>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">Pilih model untuk preview</div>
          )}
        </div>
      </div>
    </div>
  )
}