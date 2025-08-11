import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PoseEditor from '../ui/PoseEditor'

export default function PosesPage() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { 
    loadModels() 
  }, [])

  async function loadModels() {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('models')
        .select('*')
        .order('name', { ascending: true })
      setModels(data || [])
    } catch (error) {
      console.error('Error loading models:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-medium mb-4 sm:mb-6">Kelola Pose Kamera</h2>
      
      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Memuat data model...
        </div>
      ) : (
        <div className="max-w-4xl">
          <PoseEditor models={models} />
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Cara Menggunakan Pose Editor</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>1. Pilih model 3D yang ingin dibuat pose kamera</p>
              <p>2. Atur posisi kamera dengan mouse (drag untuk rotasi, scroll untuk zoom)</p>
              <p>3. Sesuaikan Zoom Level dan Field of View menggunakan slider</p>
              <p>4. Ketik nama pose dan klik "Simpan Pose"</p>
              <p>5. Pose yang tersimpan akan muncul di dropdown saat membuat armada</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}