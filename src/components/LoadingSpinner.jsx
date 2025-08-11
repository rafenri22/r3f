import React from 'react'

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-slate-600 to-slate-500 rounded-xl mb-4 shadow-2xl">
          <span className="text-2xl font-bold text-white">TJA</span>
        </div>
        <div className="w-8 h-8 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-300 mb-2">Memuat Portal TJA...</p>
        <p className="text-slate-400 text-sm">Tunggu sebentar</p>
      </div>
    </div>
  )
}