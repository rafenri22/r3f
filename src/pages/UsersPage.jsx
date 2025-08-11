import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { UserPlus, Edit2, Trash2, User, Crown, Star } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    is_admin: false,
    is_ep3: false
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
      alert('Gagal memuat data users: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.username || !formData.email || (!editUser && !formData.password)) {
      alert('Mohon lengkapi semua field yang diperlukan')
      return
    }

    setFormLoading(true)
    try {
      if (editUser) {
        // Update existing user
        const updateData = {
          username: formData.username,
          email: formData.email,
          is_admin: formData.is_admin,
          is_ep3: formData.is_ep3,
          updated_at: new Date().toISOString()
        }

        // Only update password if provided (plain text)
        if (formData.password) {
          updateData.password = formData.password
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editUser.id)

        if (error) throw error

        alert('User berhasil diperbarui!')
      } else {
        // Create new user (plain text password)
        const { error } = await supabase
          .from('users')
          .insert({
            username: formData.username,
            email: formData.email,
            password: formData.password, // Plain text password
            is_admin: formData.is_admin,
            is_ep3: formData.is_ep3
          })

        if (error) throw error

        alert('User berhasil ditambahkan!')
      }

      // Reset form
      resetForm()
      loadUsers()
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Gagal menyimpan user: ' + error.message)
    } finally {
      setFormLoading(false)
    }
  }

  async function deleteUser(userId) {
    if (!confirm('Hapus user ini? Aksi ini tidak dapat dibatalkan.')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      alert('User berhasil dihapus!')
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Gagal menghapus user: ' + error.message)
    }
  }

  function resetForm() {
    setFormData({
      username: '',
      email: '',
      password: '',
      is_admin: false,
      is_ep3: false
    })
    setEditUser(null)
    setShowForm(false)
  }

  function startEdit(user) {
    setEditUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      is_admin: user.is_admin,
      is_ep3: user.is_ep3
    })
    setShowForm(true)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Kelola Users</h2>
          <p className="text-slate-600">Mengelola pengguna dan hak akses sistem</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah User</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editUser ? 'Edit User' : 'Tambah User Baru'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Username"
                  disabled={formLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com"
                  disabled={formLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password {editUser && '(Kosongkan jika tidak ingin mengubah)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Password (plain text)"
                  disabled={formLoading}
                  required={!editUser}
                />
                <p className="text-xs text-slate-500 mt-1">Password disimpan sebagai plain text</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_admin}
                    onChange={e => setFormData({...formData, is_admin: e.target.checked})}
                    className="rounded mr-2"
                    disabled={formLoading}
                  />
                  <Crown className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm">Admin (Akses penuh ke semua fitur)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_ep3}
                    onChange={e => setFormData({...formData, is_ep3: e.target.checked})}
                    className="rounded mr-2"
                    disabled={formLoading}
                  />
                  <Star className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm">EP3 Access (Akses ke model EP3)</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                  disabled={formLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={formLoading}
                >
                  {formLoading ? 'Menyimpan...' : (editUser ? 'Update' : 'Tambah')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat data users...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Daftar Users ({users.length})</h3>
          </div>
          
          {users.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Belum ada users yang terdaftar
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {users.map(user => (
                <div key={user.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-slate-900">{user.username}</h4>
                          {user.is_admin && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                              <Crown className="w-3 h-3 mr-1" />
                              Admin
                            </span>
                          )}
                          {user.is_ep3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                              <Star className="w-3 h-3 mr-1" />
                              EP3
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{user.email}</p>
                        <p className="text-xs text-slate-400">
                          Password: {user.password} (plain text)
                        </p>
                        <p className="text-xs text-slate-500">
                          Dibuat: {new Date(user.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Panel */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Informasi Sistem Authentication</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Password sekarang menggunakan <strong>plain text</strong> (tidak di-encrypt)</p>
          <p>• Default users: admin/admin123, ep3user/user123, user/user123</p>
          <p>• Admin dapat mengelola semua users dan mengakses semua fitur</p>
          <p>• EP3 users dapat mengakses model premium</p>
        </div>
      </div>
    </div>
  )
}