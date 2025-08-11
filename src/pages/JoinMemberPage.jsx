import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, User, Phone, Users, CheckCircle } from 'lucide-react'

export default function JoinMemberPage() {
  const [formData, setFormData] = useState({
    namaLengkap: '',
    nomorHp: '',
    sudahJoinGrup: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.namaLengkap || !formData.nomorHp || !formData.sudahJoinGrup) {
      alert('Mohon lengkapi semua data yang diperlukan')
      return
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/
    if (!phoneRegex.test(formData.nomorHp.replace(/\s|-/g, ''))) {
      alert('Format nomor HP tidak valid. Gunakan format: 08xxxxxxxxx atau +62xxxxxxxxx')
      return
    }

    setIsSubmitting(true)

    // Format the message for WhatsApp
    const message = `*FORM PENDAFTARAN AKUN PORTAL TJA*

Nama Lengkap: ${formData.namaLengkap}
Nomor HP: ${formData.nomorHp}
Status Grup TJA: ${formData.sudahJoinGrup === 'sudah' ? 'Sudah bergabung' : 'Belum bergabung'}

Mohon dibuatkan akun Portal TJA untuk saya. Terima kasih!`

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message)
    
    // WhatsApp URL
    const whatsappUrl = `https://wa.me/6285759328890?text=${encodedMessage}`
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank')
    
    // Reset form after a short delay
    setTimeout(() => {
      setIsSubmitting(false)
      setFormData({
        namaLengkap: '',
        nomorHp: '',
        sudahJoinGrup: ''
      })
      alert('Pesan telah dikirim ke admin! Mohon tunggu konfirmasi untuk pembuatan akun.')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent)] pointer-events-none"></div>
      
      <div className="w-full max-w-lg">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Link 
            to="/login"
            className="inline-flex items-center text-slate-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm">Kembali ke Login</span>
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="tja.png" 
                alt="Logo TJA" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Join Member</h1>
            <p className="text-slate-400 text-sm sm:text-base">Daftar untuk mendapatkan akses ke Portal TJA</p>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nama Lengkap */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="namaLengkap"
                  value={formData.namaLengkap}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200"
                  placeholder="Masukkan nama lengkap"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Nomor HP */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Nomor HP (WhatsApp)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="tel"
                  name="nomorHp"
                  value={formData.nomorHp}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200"
                  placeholder="Contoh: 08123456789"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <p className="text-xs text-slate-400">
                Gunakan nomor WhatsApp aktif untuk konfirmasi
              </p>
            </div>

            {/* Status Grup */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Apakah sudah bergabung di grup TJA?
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sudahJoinGrup"
                    value="sudah"
                    checked={formData.sudahJoinGrup === 'sudah'}
                    onChange={handleChange}
                    className="mr-3 text-slate-400 focus:ring-slate-400"
                    disabled={isSubmitting}
                  />
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                    <span className="text-slate-200 text-sm">Sudah bergabung di grup TJA</span>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sudahJoinGrup"
                    value="belum"
                    checked={formData.sudahJoinGrup === 'belum'}
                    onChange={handleChange}
                    className="mr-3 text-slate-400 focus:ring-slate-400"
                    disabled={isSubmitting}
                  />
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-slate-400 mr-2" />
                    <span className="text-slate-200 text-sm">Belum bergabung di grup TJA</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Kirim Pendaftaran</span>
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
            <h4 className="text-blue-200 font-medium mb-2 text-sm">ℹ️ Informasi Pendaftaran</h4>
            <ul className="text-xs text-blue-100 space-y-1">
              <li>• Form akan mengirim pesan otomatis ke admin via WhatsApp</li>
              <li>• Admin akan memproses pendaftaran dalam 1x24 jam</li>
              <li>• Pastikan nomor WhatsApp aktif untuk konfirmasi</li>
              <li>• Akun akan diberikan setelah verifikasi admin</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          © 2025 PT. Trijaya Agung Lestari
        </div>
      </div>
    </div>
  )
}