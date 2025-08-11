import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PoseEditor from '../ui/PoseEditor'

export default function PosesPage(){
  const [models, setModels] = useState([])

  useEffect(()=>{ loadModels() }, [])
  async function loadModels(){
    const { data } = await supabase.from('models').select('*')
    setModels(data||[])
  }

  return (
    <div>
      <h2 className="text-2xl mb-4">Poses</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <PoseEditor models={models} />
        </div>
        <div>
          <h3 className="font-semibold mb-2">Notes</h3>
          <div className="p-3 bg-white border rounded">
            <p className="text-sm text-gray-600">Pilih model di kiri, load model lalu atur kamera. Simpan pose untuk dipakai saat tambah armada.</p>
          </div>
        </div>
      </div>
    </div>
  )
}