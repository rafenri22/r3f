import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { 
  Monitor, 
  Users, 
  Palette, 
  Camera, 
  Star, 
  Shield,
  ArrowRight,
  Zap,
  Database,
  Settings
} from 'lucide-react'

export default function HomePage() {
  const { user, isAdmin, isEp3 } = useAuth()

  const adminFeatures = [
    {
      title: 'Kelola Model 3D',
      description: 'Upload dan kelola model bus 3D untuk sistem livery',
      icon: Monitor,
      link: '/models',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Atur Pose Kamera',
      description: 'Buat dan kelola pose kamera untuk preview optimal',
      icon: Camera,
      link: '/poses',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Manajemen Armada',
      description: 'Kelola data armada dan livery dengan mudah',
      icon: Database,
      link: '/armada',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Kelola Users',
      description: 'Manajemen pengguna dan hak akses sistem',
      icon: Users,
      link: '/users',
      color: 'from-red-500 to-red-600'
    }
  ]

  const userFeatures = [
    {
      title: 'Testing Livery',
      description: 'Preview dan download desain livery armada TJA',
      icon: Palette,
      link: '/testing',
      color: 'from-indigo-500 to-indigo-600',
      highlight: true
    }
  ]

  const features = isAdmin ? adminFeatures : userFeatures

  const stats = [
    {
      label: 'Status',
      value: isAdmin ? 'Admin' : 'Member TJA',
      icon: isAdmin ? Shield : Users,
      color: isAdmin ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'
    },
    {
      label: 'Mod Ep3 Access',
      value: isEp3 ? 'Aktif' : 'Tidak Aktif',
      icon: Star,
      color: isEp3 ? 'text-purple-600 bg-purple-100' : 'text-gray-600 bg-gray-100'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Welcome Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-slate-600 to-slate-500 rounded-2xl flex items-center justify-center shadow-xl">
              <img 
                src="tja.png" 
                alt="Logo TJA" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
              />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
            Selamat Datang, <span className="text-slate-600">{user?.name}</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Portal terintegrasi PT. Trijaya Agung Lestari adalah laman untuk memudahkan para civitas perusahaan dalam mengakses berbagai fitur dan informasi terkait dengan PT. Trijaya Agung Lestari
          </p>
          
          {/* User Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 justify-items-center" />
                </div>
                <h3 className="font-medium text-slate-700 text-sm sm:text-base mb-1">{stat.label}</h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Features */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">
            {isAdmin ? 'Panel Administrator' : 'Fitur Tersedia'}
          </h2>
          
          <div className={`grid gap-4 sm:gap-6 ${
            features.length === 1 
              ? 'max-w-md mx-auto' 
              : features.length === 2 
                ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          }`}>
            {features.map((feature, index) => (
              <Link
                key={index}
                to={feature.link}
                className={`group bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                  feature.highlight ? 'ring-2 ring-indigo-200 bg-gradient-to-br from-white to-indigo-50' : ''
                }`}
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2 sm:mb-3 text-center group-hover:text-slate-700 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-xs sm:text-sm text-slate-600 text-center leading-relaxed mb-4 sm:mb-6">
                  {feature.description}
                </p>
                
                <div className="flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
                  <span className="text-xs sm:text-sm font-medium mr-2">Mulai</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            </div>
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 text-center mb-3 sm:mb-4">
            Progress Pengembangan Sistem Portal TJA
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl font-bold text-blue-900">Download Asset</div>
              <div className="text-xs sm:text-sm text-slate-600">*Dalam proses Pengembangan</div>
            </div>
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl font-bold text-blue-900">Data Armada</div>
              <div className="text-xs sm:text-sm text-slate-600">*Dalam proses Pengembangan</div>
            </div>
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl font-bold text-blue-900">Data Karyawan</div>
              <div className="text-xs sm:text-sm text-slate-600">*Dalam proses Pengembangan</div>
            </div>
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl font-bold text-blue-900">Testing Mod&Livery</div>
              <div className="text-xs sm:text-sm text-slate-600">Tersedia</div>
            </div>
          </div>
        </div>

        {/* Quick Actions for Admin */}
        {isAdmin && (
          <div className="mt-8 sm:mt-12">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 text-center mb-4 sm:mb-6">
              Quick Actions
            </h3>
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              <Link
                to="/models"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Monitor className="w-3 h-3 sm:w-4 sm:h-4" />
                Upload Model
              </Link>
              <Link
                to="/armada"
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Database className="w-3 h-3 sm:w-4 sm:h-4" />
                Tambah Armada
              </Link>
              <Link
                to="/users"
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                Kelola User
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}