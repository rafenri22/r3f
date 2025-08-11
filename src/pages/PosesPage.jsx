import React, { useEffect, useState } from 'react'
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
      const { data } = await supabase.from('models').select('*')
      setModels(data || [])
    } catch (error) {
      console.error('Error loading models:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-medium mb-4 sm:mb-6">Kelola Pose Screenshot</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div>
          {loading ? (
            <div className="p-4 border rounded bg-white">
              <div className="text-center py-8 text-gray-500">
                Memuat model...
              </div>
            </div>
          ) : (
            <PoseEditor models={models} />
          )}
        </div>
        
        <div>
          <h3 className="font-semibold mb-3">Panduan Pose Editor</h3>
          <div className="p-4 bg-white border rounded space-y-3">
            <div className="text-sm text-gray-700">
              <h4 className="font-medium mb-2">Cara Menggunakan:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Pilih model 3D dari dropdown</li>
                <li>Gunakan mouse untuk mengatur posisi kamera:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Drag kiri: Rotasi kamera</li>
                    <li>Drag kanan: Pan kamera</li>
                    <li>Scroll: Zoom in/out</li>
                  </ul>
                </li>
                <li>Atur posisi yang diinginkan untuk screenshot</li>
                <li>Beri nama pose yang deskriptif</li>
                <li>Klik "Simpan Pose" untuk menyimpan</li>
              </ol>
            </div>
            
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <strong>Tips:</strong> Buat beberapa pose berbeda untuk setiap model (depan, samping, 3/4, dll) agar admin memiliki pilihan saat menambah armada.
            </div>
            
            <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">
              <strong>Catatan:</strong> Pose yang disimpan akan digunakan sebagai posisi kamera default saat admin membuat screenshot thumbnail untuk armada.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}