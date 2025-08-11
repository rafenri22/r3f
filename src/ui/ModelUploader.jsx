import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useUploadProgress } from '../hooks/useUploadProgress'
import LoadingProgress from '../components/LoadingProgress'

export default function ModelUploader({ onUploaded }) {
  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const {
    uploadProgress,
    isUploading,
    uploadMessage,
    startUpload,
    updateProgress,
    finishUpload,
    cancelUpload
  } = useUploadProgress()

  async function upload() {
    if (!name || !file) {
      return alert('Nama model dan file GLB/GLTF diperlukan')
    }
    
    try {
      startUpload('Preparing upload...')
      
      // Simulate preparation delay
      await new Promise(resolve => setTimeout(resolve, 300))
      updateProgress(10, 'Uploading model file...')
      
      const key = `models/${Date.now()}_${file.name}`
      
      // Upload with progress tracking
      const { error: upErr } = await supabase.storage
        .from('models')
        .upload(key, file, { 
          cacheControl: '3600', 
          upsert: false
        })
      
      if (upErr) throw upErr
      
      updateProgress(70, 'Processing model...')
      
      const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/models/${encodeURIComponent(key)}`
      
      updateProgress(85, 'Saving to database...')
      
      const { error: insertErr } = await supabase.from('models').insert({ 
        name, 
        glb_url: publicUrl 
      })
      
      if (insertErr) throw insertErr
      
      updateProgress(100, 'Upload complete!')
      finishUpload()
      
      setName('')
      setFile(null)
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) fileInput.value = ''
      
      onUploaded && onUploaded()
      alert('Model berhasil diupload!')
      
    } catch (e) {
      console.error(e)
      cancelUpload()
      alert('Upload gagal: ' + e.message)
    }
  }

  return (
    <div className="p-4 border rounded bg-white">
      <h3 className="font-semibold mb-3">Upload Model 3D</h3>
      
      {isUploading && (
        <div className="mb-4">
          <LoadingProgress progress={uploadProgress} message={uploadMessage} />
        </div>
      )}
      
      <div className="space-y-3">
        <input 
          className="w-full p-2 border rounded" 
          placeholder="Nama model (contoh: Bus Scania K410)" 
          value={name} 
          onChange={e => setName(e.target.value)}
          disabled={isUploading}
        />
        
        <div>
          <label className="block text-sm font-medium mb-1">
            File GLB/GLTF
          </label>
          <input 
            type="file" 
            accept=".glb,.gltf" 
            onChange={e => setFile(e.target.files?.[0] || null)}
            disabled={isUploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Pastikan model memiliki material bernama 'bodybasic' dan 'alpha'
          </p>
        </div>
        
        <button 
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" 
          onClick={upload} 
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Model'}
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
    </div>
  )
}