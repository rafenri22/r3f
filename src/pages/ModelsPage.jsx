import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ModelUploader from '../ui/ModelUploader'

export default function ModelsPage(){
  const [models, setModels] = useState([])

  useEffect(()=>{ load() }, [])
  async function load(){
    const { data } = await supabase.from('models').select('*').order('created_at', {ascending: false})
    setModels(data || [])
  }

  return (
    <div>
      <h2 className="text-2xl font-medium mb-4">Models</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <ModelUploader onUploaded={load} />
        </div>
        <div>
          <h3 className="font-semibold mb-2">Existing Models</h3>
          <div className="space-y-3">
            {models.map(m => (
              <div key={m.id} className="p-3 border rounded bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-gray-500">{m.glb_url}</div>
                  </div>
                  <a className="text-sm text-blue-600" href={m.glb_url} target="_blank">open</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}