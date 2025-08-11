import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ThumbnailUploader({ armadaId, currentThumbnail, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)

  async function uploadThumbnail() {
    if (!file || !armadaId) return

    setLoading(true)
    try {
      // Generate unique filename
      const timestamp = Date.now()
      const filename = `thumbnails/armada_${armadaId}_${timestamp}_${file.name}`

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(filename, file)

      if (uploadError) throw uploadError

      // Get public URL
      const thumbnailUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/thumbnails/${encodeURIComponent(filename)}`

      // Update armada record
      const { error: updateError } = await supabase
        .from('armada')
        .update({ thumbnail_url: thumbnailUrl })
        .eq('id', armadaId)

      if (updateError) throw updateError

      alert('Thumbnail berhasil diupload!')
      setFile(null)
      
      // Reset file input
      const fileInput = document.getElementById(`thumbnail-${armadaId}`)
      if (fileInput) fileInput.value = ''

      if (onUpdate) onUpdate()

    } catch (error) {
      console.error('Error uploading thumbnail:', error)
      alert('Gagal upload thumbnail: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium mb-1">
          Update Thumbnail
        </label>
        <input
          id={`thumbnail-${armadaId}`}
          type="file"
          accept="image/*"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {file && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{file.name}</span>
          <button
            onClick={uploadThumbnail}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}

      {currentThumbnail && (
        <div className="mt-2">
          <img
            src={currentThumbnail}
            alt="Current thumbnail"
            className="w-20 h-20 object-cover rounded border"
          />
          <p className="text-xs text-gray-500 mt-1">Current thumbnail</p>
        </div>
      )}
    </div>
  )
}