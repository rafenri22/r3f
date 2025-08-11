import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadFile, deleteFile, parseStorageUrl } from '../lib/storage'
import ArmadaForm from '../ui/ArmadaForm'
import SecureImage from '../ui/SecureImage'

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
      // Get armada data to clean up storage files
      const armada = armadas.find(a => a.id === id)
      if (!armada) return

      // Delete from database first
      const { error } = await supabase.from('armada').delete().eq('id', id)
      if (error) throw error

      // Clean up storage files
      const filesToDelete = [
        armada.livery_body_url,
        armada.livery_alpha_url,
        armada.thumbnail_url
      ].filter(Boolean)

      for (const fileUrl of filesToDelete) {
        try {
          const parsed = parseStorageUrl(fileUrl)
          if (parsed) {
            await deleteFile(parsed.bucket, parsed.path)
          }
        } catch (deleteError) {
          console.warn('Failed to delete storage file:', fileUrl, deleteError)
        }
      }
      
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
        
        // Upload new thumbnail using secure storage
        const ts = Date.now()
        const thumbnailKey = `thumbnails/${armada.kode_bus}_${ts}_updated_${file.name}`
        
        const uploadResult = await uploadFile('thumbnails', thumbnailKey, file)
        
        // Update armada record with path only
        const { error: updateError } = await supabase
          .from('armada')
          .update({ thumbnail_url: uploadResult.path })
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-medium">Kelola Armada</h2>
        <p className="text-sm text-gray-600 mt-1">🔒 Semua file disimpan dengan aman dan hanya bisa diakses melalui aplikasi</p>
      </div>
      
      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Memuat data...
        </div>
      ) : (
        <>
          <ArmadaForm models={models} onSuccess={loadData} />
          
          <div className="mt-6 sm:mt-8">
            <h3 className="text-lg sm:text-xl font-medium mb-3 sm:mb-4">Daftar Armada ({armadas.length})</h3>
            
            {armadas.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-white border rounded">
                Belum ada armada yang ditambahkan
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {armadas.map(armada => (
                  <div key={armada.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    {armada.thumbnail_url ? (
                      <SecureImage 
                        src={armada.thumbnail_url}
                        bucket="thumbnails"
                        alt={armada.kode_bus}
                        className="w-full h-28 sm:h-32 object-cover rounded-t-lg"
                        fallback={
                          <div className="w-full h-28 sm:h-32 bg-gray-200 rounded-t-lg flex items-center justify-center">
                            <span className="text-gray-500 text-sm">🔒 Secure Thumbnail</span>
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-full h-28 sm:h-32 bg-gray-200 rounded-t-lg flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No Thumbnail</span>
                      </div>
                    )}
                    
                    <div className="p-3 sm:p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-base sm:text-lg text-gray-900 truncate flex-1 mr-2">{armada.kode_bus}</h4>
                        <div className="flex gap-1 flex-shrink-0">
                          <button 
                            className="text-xs px-1.5 py-1 sm:px-2 sm:py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() => updateThumbnail(armada.id)}
                            title="Update Thumbnail"
                          >
                            📸
                          </button>
                          <button 
                            className="text-xs px-1.5 py-1 sm:px-2 sm:py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            onClick={() => deleteArmada(armada.id)}
                            title="Hapus Armada"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                        {armada.nickname && <div><strong>Nickname:</strong> {armada.nickname}</div>}
                        {armada.crew && <div><strong>Crew:</strong> {armada.crew}</div>}
                        {armada.division && (
                          <div>
                            <strong>Division:</strong> 
                            <span className={`ml-1 px-1.5 py-0.5 text-xs rounded ${
                              armada.division === 'AKAP' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {armada.division}
                            </span>
                          </div>
                        )}
                        <div><strong>Model:</strong> <span className="break-words">{armada.models?.name || 'Unknown'}</span></div>
                        {armada.poses?.name && <div><strong>Pose:</strong> <span className="break-words">{armada.poses.name}</span></div>}
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-1">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          🔒 Secure Storage
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Private Access
                        </span>
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