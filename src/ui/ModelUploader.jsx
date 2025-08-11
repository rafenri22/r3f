import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ModelUploader({ onUploaded }) {
  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  async function upload() {
    if (!name || !file) {
      return alert('Nama model dan file GLB/GLTF diperlukan')
    }
    
    setLoading(true)
    try {
      const key = `models/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage
        .from('models')
        .upload(key, file, { cacheControl: '3600', upsert: false })
      
      if (upErr) throw upErr
      
      const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/models/${encodeURIComponent(key)}`
      
      const { error: insertErr } = await supabase.from('models').insert({ 
        name, 
        glb_url: publicUrl 
      })
      
      if (insertErr) throw insertErr
      
      setName('')
      setFile(null)
      onUploaded && onUploaded()
      alert('Model berhasil diupload!')
      
    } catch (e) {
      console.error(e)
      alert('Upload gagal: ' + e.message)
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="p-4 border rounded bg-white">
      <h3 className="font-semibold mb-3">Upload Model 3D</h3>
      
      <div className="space-y-3">
        <input 
          className="w-full p-2 border rounded" 
          placeholder="Nama model (contoh: Bus Scania K410)" 
          value={name} 
          onChange={e => setName(e.target.value)} 
        />
        
        <div>
          <label className="block text-sm font-medium mb-1">
            File GLB/GLTF
          </label>
          <input 
            type="file" 
            accept=".glb,.gltf" 
            onChange={e => setFile(e.target.files?.[0] || null)} 
          />
          <p className="text-xs text-gray-500 mt-1">
            Pastikan model memiliki material bernama 'bodybasic' dan 'alpha'
          </p>
        </div>
        
        <button 
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" 
          onClick={upload} 
          disabled={loading}
        >
          {loading ? 'Mengupload...' : 'Upload Model'}
        </button>
      </div>
    </div>
  )
}