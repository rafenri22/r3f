import React from 'react'
import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg mb-4">
              <span className="text-lg font-bold text-white">TJA</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Portal TJA</h3>
            <p className="text-slate-400 text-sm mb-4">
              Sistem manajemen armada bus terpadu untuk PT. Trijaya Agung Lestari.
            </p>
            <div className="text-slate-400 text-sm">
              <p>PT. Trijaya Agung Lestari</p>
              <p>Portal Armada Digital</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Fitur Utama</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>• Manajemen Model 3D</li>
              <li>• Editor Pose Kamera</li>
              <li>• Database Armada</li>
              <li>• Testing Livery Real-time</li>
              <li>• Generate Thumbnail HD</li>
            </ul>
          </div>

          {/* Developer Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Pengembang</h4>
            <div className="text-slate-400 text-sm space-y-2">
              <p><strong className="text-slate-300">Developer:</strong></p>
              <p>Rafky Ferdian Algiffari</p>
              <p className="text-xs pt-2 border-t border-slate-800">
                Dibuat dengan teknologi React, Three.js, dan Supabase
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
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