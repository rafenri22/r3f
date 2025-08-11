import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ModelUploader from '../ui/ModelUploader'
import LoadingProgress from '../components/LoadingProgress'
import { Star, Eye, Trash2 } from 'lucide-react'

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
      const { error } = await supabase.from('models').delete().eq('id', id)
      if (error) throw error
      
      alert('Model berhasil dihapus!')
      load()
    } catch (error) {
      console.error('Error deleting model:', error)
      alert('Gagal menghapus model: ' + error.message)
    } finally {
      setDeleting(null)
    }
  }

  async function toggleEp3Status(id, currentStatus) {
    try {
      const { error } = await supabase
        .from('models')
        .update({ is_ep3: !currentStatus })
        .eq('id', id)
      
      if (error) throw error
      
      alert(`Model berhasil diubah ke ${!currentStatus ? 'EP3' : 'Regular'}!`)
      load()
    } catch (error) {
      console.error('Error updating model:', error)
      alert('Gagal mengubah status model: ' + error.message)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-medium mb-4 sm:mb-6">Kelola Model 3D</h2>
      
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
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-base sm:text-lg">{m.name}</div>
                        {m.is_ep3 && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            <Star className="w-3 h-3 mr-1" />
                            EP3
                          </div>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 break-all">
                        {m.glb_url}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        ID: {m.id}
                      </div>
                      <div className="text-xs text-gray-400">
                        Created: {new Date(m.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                      <a 
                        className="px-3 py-1 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 whitespace-nowrap flex items-center gap-1" 
                        href={m.glb_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </a>
                      <button 
                        className={`px-3 py-1 text-xs sm:text-sm rounded hover:opacity-80 whitespace-nowrap flex items-center gap-1 ${
                          m.is_ep3 
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => toggleEp3Status(m.id, m.is_ep3)}
                        title={m.is_ep3 ? 'Ubah ke Regular' : 'Ubah ke EP3'}
                      >
                        <Star className="w-3 h-3" />
                        {m.is_ep3 ? 'EP3' : 'Regular'}
                      </button>
                      <button 
                        className="px-3 py-1 text-xs sm:text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 whitespace-nowrap flex items-center gap-1"
                        onClick={() => deleteModel(m.id)}
                        disabled={deleting === m.id}
                      >
                        <Trash2 className="w-3 h-3" />
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

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Informasi EP3 System</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Regular Model:</strong> Dapat diakses oleh semua user</p>
          <p>• <strong>EP3 Model:</strong> Hanya dapat diakses oleh user dengan akses EP3</p>
          <p>• Admin dapat mengubah status model kapan saja</p>
          <p>• User biasa tidak tahu mana model EP3, mereka hanya tidak bisa memilih model yang tidak ada aksesnya</p>
        </div>
      </div>
    </div>
  )
}