import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ModelUploader({ onUploaded }){
  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  async function upload(){
    if(!name || !file) return alert('nama + glb/gltf required')
    setLoading(true)
    try{
      const key = `models/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage.from('models').upload(key, file, { cacheControl: '3600', upsert: false })
      if(upErr) throw upErr
      const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/models/${encodeURIComponent(key)}`
      const { error: insertErr } = await supabase.from('models').insert({ name, glb_url: publicUrl })
      if(insertErr) throw insertErr
      setName('')
      setFile(null)
      onUploaded && onUploaded()
      alert('Model uploaded')
    }catch(e){
      console.error(e)
      alert('Upload gagal: ' + e.message)
    }finally{ setLoading(false) }
  }

  return (
    <div className="p-4 border rounded bg-white">
      <h3 className="font-semibold mb-2">Upload Model Polos</h3>
      <div className="space-y-2">
        <input className="w-full p-2 border rounded" placeholder="Nama model" value={name} onChange={e=>setName(e.target.value)} />
        <input type="file" accept=".glb,.gltf" onChange={e=>setFile(e.target.files?.[0]||null)} />
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={upload} disabled={loading}>{loading? 'Uploading...': 'Upload'}</button>
        </div>
      </div>
    </div>
  )
}