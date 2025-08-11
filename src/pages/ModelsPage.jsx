import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ModelUploader from '../ui/ModelUploader'

export default function ModelsPage() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)

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
      const { error } = await supabase.from('models').delete().eq('id', id)
      if (error) throw error
      
      alert('Model berhasil dihapus!')
      load()
    } catch (error) {
      console.error('Error deleting model:', error)
      alert('Gagal menghapus model: ' + error.message)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-medium mb-6">Kelola Model 3D</h2>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <ModelUploader onUploaded={load} />
        </div>
        
        <div>
          <h3 className="font-semibold mb-3">Model yang Tersedia</h3>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Memuat model...
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {models.map(m => (
                <div key={m.id} className="p-4 border rounded bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-lg">{m.name}</div>
                      <div className="text-sm text-gray-500 break-all">
                        {m.glb_url}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        ID: {m.id}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <a 
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200" 
                        href={m.glb_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Preview
                      </a>
                      <button 
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        onClick={() => deleteModel(m.id)}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
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