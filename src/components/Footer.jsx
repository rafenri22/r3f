import React from 'react'
import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-slate-400 text-sm">
            © 2024 PT. Trijaya Agung Lestari. All rights reserved.
          </div>
          <div className="flex items-center text-slate-400 text-sm mt-4 md:mt-0">
            <span>Dibuat dengan</span>
            <Heart className="h-4 w-4 mx-1 text-red-400" />
            <span>oleh Rafky Ferdian Algiffari</span>
          </div>
        </div>
      </div>
    </footer>
  )
}