import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ArmadaForm from '../ui/ArmadaForm'

export default function ArmadaPage(){
  const [models, setModels] = useState([])

  useEffect(()=>{ loadModels() }, [])
  async function loadModels(){
    const { data } = await supabase.from('models').select('*')
    setModels(data||[])
  }

  return (
    <div>
      <h2 className="text-2xl mb-4">Armada</h2>
      <ArmadaForm models={models} />
    </div>
  )
}
