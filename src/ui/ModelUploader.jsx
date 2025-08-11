import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useUploadProgress } from '../hooks/useUploadProgress'
import LoadingProgress from '../components/LoadingProgress'

export default function ModelUploader({ onUploaded }) {
  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileProgress, setFileProgress] = useState(0)
  
  const {
    uploadProgress,
    isUploading,
    uploadMessage,
    startUpload,
    updateProgress,
    finishUpload,
    cancelUpload
  } = useUploadProgress()

  function handleFileSelect(selectedFile) {
    setFile(selectedFile)
    
    if (selectedFile) {
      setFileLoading(true)
      setFileProgress(0)
      
      // Simulate file processing progress
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 25
        if (progress < 90) {
          setFileProgress(progress)
        }
      }, 200)
      
      // Finish loading after file is ready
      setTimeout(() => {
        clearInterval(interval)
        setFileProgress(100)
        setTimeout(() => {
          setFileLoading(false)
          setFileProgress(0)
        }, 500)
      }, 1500)
    } else {
      setFileLoading(false)
      setFileProgress(0)
    }
  }

  async function upload() {
    if (!name || !file) {
      return alert('Nama model dan file GLB/GLTF diperlukan')
    }
    
    try {
      startUpload('Preparing 3D model upload...')
      
      // Simulate preparation delay with progress
      await new Promise(resolve => setTimeout(resolve, 500))
      updateProgress(10, 'Validating 3D model file...')
      
      await new Promise(resolve => setTimeout(resolve, 300))
      updateProgress(20, 'Uploading 3D model to storage...')
      
      const key = `models/${Date.now()}_${file.name}`
      
      // Upload with simulated progress tracking
      const uploadPromise = supabase.storage
        .from('models')
        .upload(key, file, { 
          cacheControl: '3600', 
          upsert: false
        })
      
      // Simulate upload progress
      let uploadProgress = 20
      const progressInterval = setInterval(() => {
        if (uploadProgress < 70) {
          uploadProgress += Math.random() * 10
          updateProgress(uploadProgress, 'Uploading 3D model...')
        }
      }, 500)
      
      const { error: upErr } = await uploadPromise
      clearInterval(progressInterval)
      
      if (upErr) throw upErr
      
      updateProgress(80, 'Processing 3D model...')
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/models/${encodeURIComponent(key)}`
      
      updateProgress(90, 'Saving model to database...')
      
      const { error: insertErr } = await supabase.from('models').insert({ 
        name, 
        glb_url: publicUrl 
      })
      
      if (insertErr) throw insertErr
      
      updateProgress(100, '3D model upload complete!')
      finishUpload()
      
      setName('')
      setFile(null)
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) fileInput.value = ''
      
      onUploaded && onUploaded()
      alert('Model 3D berhasil diupload!')
      
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
      
      {fileLoading && (
        <div className="mb-4">
          <LoadingProgress progress={fileProgress} message="Processing 3D model file..." />
        </div>
      )}
      
      <div className="space-y-3">
        <input 
          className="w-full p-2 border rounded" 
          placeholder="Nama model (contoh: Bus Scania K410)" 
          value={name} 
          onChange={e => setName(e.target.value)}
          disabled={isUploading || fileLoading}
        />
        
        <div>
          <label className="block text-sm font-medium mb-1">
            File GLB/GLTF
          </label>
          <input 
            type="file" 
            accept=".glb,.gltf" 
            onChange={e => handleFileSelect(e.target.files?.[0] || null)}
            disabled={isUploading || fileLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Pastikan model memiliki material bernama 'bodybasic' dan 'alpha' dengan UV mapping yang benar
          </p>
          
          {file && !fileLoading && (
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              File 3D siap: {file.name}
            </p>
          )}
        </div>
        
        <button 
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" 
          onClick={upload} 
          disabled={isUploading || fileLoading}
        >
          {isUploading ? 'Uploading 3D Model...' : fileLoading ? 'Processing File...' : 'Upload Model'}
        </button>
        
        {isUploading && (
          <button 
            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600" 
            onClick={cancelUpload}
          >
            Cancel Upload
          </button>
        )}
        
        {file && !fileLoading && !isUploading && (
          <div className="p-2 bg-green-50 rounded text-xs text-green-700">
            <strong>File siap untuk upload:</strong> UV mapping akan dipertahankan sesuai aslinya untuk memastikan texture livery sesuai dengan desain.
          </div>
        )}
      </div>
    </div>
  )
}