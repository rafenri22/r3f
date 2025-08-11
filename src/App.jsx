import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import ModelsPage from './pages/ModelsPage'
import PosesPage from './pages/PosesPage'
import ArmadaPage from './pages/ArmadaPage'

export default function App(){
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">TJA Admin Panel</h1>
        <nav className="space-x-4">
          <Link to="/models" className="text-sm">Models</Link>
          <Link to="/poses" className="text-sm">Poses</Link>
          <Link to="/armada" className="text-sm">Armada</Link>
        </nav>
      </header>

      <main className="p-6">
        <Routes>
          <Route path="/" element={<ModelsPage/>} />
          <Route path="/models" element={<ModelsPage/>} />
          <Route path="/poses" element={<PosesPage/>} />
          <Route path="/armada" element={<ArmadaPage/>} />
        </Routes>
      </main>
    </div>
  )
}