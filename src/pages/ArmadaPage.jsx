import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ArmadaForm from '../ui/ArmadaForm'

export default function ArmadaPage() {
  const [models, setModels] = useState([])
  const [armadas, setArmadas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { 
    loadData() 
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [modelsResult, armadasResult] = await Promise.all([
        supabase.from('models').select('*'),
        supabase.from('armada').select(`
          *,
          models(name),
          poses(name)
        `).order('created_at', { ascending: false })
      ])
      
      setModels(modelsResult.data || [])
      setArmadas(armadasResult.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteArmada(id) {
    if (!confirm('Hapus armada ini?')) return
    
    try {
      const { error } = await supabase.from('armada').delete().eq('id', id)
      if (error) throw error
      
      alert('Armada berhasil dihapus!')
      loadData()
    } catch (error) {
      console.error('Error deleting armada:', error)
      alert('Gagal menghapus armada: ' + error.message)
    }
  }

  async function updateThumbnail(armadaId) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      
      try {
        const armada = armadas.find(a => a.id === armadaId)
        if (!armada) return
        
        // Upload new thumbnail
        const ts = Date.now()
        const thumbnailKey = `thumbnails/${armada.kode_bus}_${ts}_updated_${file.name}`
        
        const { error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailKey, file)
        
        if (uploadError) throw uploadError
        
        const thumbnailUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/thumbnails/${encodeURIComponent(thumbnailKey)}`
        
        // Update armada record
        const { error: updateError } = await supabase
          .from('armada')
          .update({ thumbnail_url: thumbnailUrl })
          .eq('id', armadaId)
        
        if (updateError) throw updateError
        
        alert('Thumbnail berhasil diperbarui!')
        loadData()
        
      } catch (error) {
        console.error('Error updating thumbnail:', error)
        alert('Gagal memperbarui thumbnail: ' + error.message)
      }
    }
    
    input.click()
  }

  return (
    <div>
      <h2 className="text-2xl font-medium mb-6">Kelola Armada</h2>
      
      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Memuat data...
        </div>
      ) : (
        <>
          <ArmadaForm models={models} onSuccess={loadData} />
          
          <div className="mt-8">
            <h3 className="text-xl font-medium mb-4">Daftar Armada ({armadas.length})</h3>
            
            {armadas.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-white border rounded">
                Belum ada armada yang ditambahkan
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {armadas.map(armada => (
                  <div key={armada.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    {armada.thumbnail_url ? (
                      <img 
                        src={armada.thumbnail_url} 
                        alt={armada.kode_bus}
                        className="w-full h-32 object-cover rounded-t-lg"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 rounded-t-lg flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No Thumbnail</span>
                      </div>
                    )}
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg text-gray-900">{armada.kode_bus}</h4>
                        <div className="flex gap-1">
                          <button 
                            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() => updateThumbnail(armada.id)}
                            title="Update Thumbnail"
                          >
                            📸
                          </button>
                          <button 
                            className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            onClick={() => deleteArmada(armada.id)}
                            title="Hapus Armada"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        {armada.nickname && <div><strong>Nickname:</strong> {armada.nickname}</div>}
                        {armada.crew && <div><strong>Crew:</strong> {armada.crew}</div>}
                        {armada.division && (
                          <div>
                            <strong>Division:</strong> 
                            <span className={`ml-1 px-2 py-0.5 text-xs rounded ${
                              armada.division === 'AKAP' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {armada.division}
                            </span>
                          </div>
                        )}
                        <div><strong>Model:</strong> {armada.models?.name || 'Unknown'}</div>
                        {armada.poses?.name && <div><strong>Pose:</strong> {armada.poses.name}</div>}
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-1">
                        {armada.livery_body_url && (
                          <a 
                            href={armada.livery_body_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Body
                          </a>
                        )}
                        {armada.livery_alpha_url && (
                          <a 
                            href={armada.livery_alpha_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Alpha
                          </a>
                        )}
                        {armada.thumbnail_url && (
                          <a 
                            href={armada.thumbnail_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                          >
                            Thumbnail
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}