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
            <h3 className="text-xl font-medium mb-4">Daftar Armada</h3>
            
            {armadas.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-white border rounded">
                Belum ada armada yang ditambahkan
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {armadas.map(armada => (
                  <div key={armada.id} className="p-4 bg-white border rounded">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg">{armada.kode_bus}</h4>
                      <button 
                        className="text-red-500 hover:text-red-700 text-sm"
                        onClick={() => deleteArmada(armada.id)}
                      >
                        Hapus
                      </button>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div><strong>Nickname:</strong> {armada.nickname || '-'}</div>
                      <div><strong>Crew:</strong> {armada.crew || '-'}</div>
                      <div><strong>Model:</strong> {armada.models?.name || 'Unknown'}</div>
                      <div><strong>Pose:</strong> {armada.poses?.name || 'Default'}</div>
                    </div>
                    
                    <div className="mt-3 flex gap-2">
                      {armada.livery_body_url && (
                        <a 
                          href={armada.livery_body_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                        >
                          Body
                        </a>
                      )}
                      {armada.livery_alpha_url && (
                        <a 
                          href={armada.livery_alpha_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded"
                        >
                          Alpha
                        </a>
                      )}
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