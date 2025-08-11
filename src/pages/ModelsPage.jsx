import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { deleteFile, parseStorageUrl } from '../lib/storage'
import ModelUploader from '../ui/ModelUploader'
import LoadingProgress from '../components/LoadingProgress'

export default function ModelsPage() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { 
    load() 
  }, [])

  async function load() {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false })
      setModels(data || [])
    } catch (error) {
      console.error('Error loading models:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteModel(id) {
    if (!confirm('Hapus model ini? Semua pose dan armada yang menggunakan model ini akan terpengaruh.')) {
      return
    }
    
    try {
      setDeleting(id)
      
      // Get model data to clean up storage file
      const model = models.find(m => m.id === id)
      if (!model) return

      // Delete from database first
      const { error } = await supabase.from('models').delete().eq('id', id)
      if (error) throw error

      // Clean up storage file
      try {
        const parsed = parseStorageUrl(model.glb_url)
        if (parsed) {
          await deleteFile(parsed.bucket, parsed.path)
        } else {
          // If it's just a path, assume it's in models bucket
          await deleteFile('models', model.glb_url)
        }
      } catch (deleteError) {
        console.warn('Failed to delete storage file:', model.glb_url, deleteError)
      }
      
      alert('Model berhasil dihapus!')
      load()
    } catch (error) {
      console.error('Error deleting model:', error)
      alert('Gagal menghapus model: ' + error.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-medium">Kelola Model 3D</h2>
        <p className="text-sm text-gray-600 mt-1">🔒 Model disimpan dengan aman dan hanya bisa diakses melalui aplikasi</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <ModelUploader onUploaded={load} />
        </div>
        
        <div>
          <h3 className="font-semibold mb-3">Model yang Tersedia</h3>
          
          {loading ? (
            <div className="p-4 border rounded bg-white">
              <LoadingProgress progress={100} message="Loading models..." />
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {models.map(m => (
                <div key={m.id} className="p-3 sm:p-4 border rounded bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base sm:text-lg">{m.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500 break-all">
                        🔒 Secure Storage: {m.glb_url}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        ID: {m.id}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                      <span className="px-3 py-1 text-xs sm:text-sm bg-green-100 text-green-700 rounded whitespace-nowrap">
                        🔒 Private
                      </span>
                      <button 
                        className="px-3 py-1 text-xs sm:text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 whitespace-nowrap"
                        onClick={() => deleteModel(m.id)}
                        disabled={deleting === m.id}
                      >
                        {deleting === m.id ? 'Deleting...' : 'Hapus'}
                      </button>
                    </div>
                  </div>
                  
                  {deleting === m.id && (
                    <div className="mt-2">
                      <LoadingProgress progress={50} message="Deleting model..." />
                    </div>
                  )}
                </div>
              ))}
              
              {models.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Belum ada model yang diupload
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}