import { useState } from 'react'

export function useUploadProgress() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')

  const startUpload = (message = 'Uploading...') => {
    setIsUploading(true)
    setUploadProgress(0)
    setUploadMessage(message)
  }

  const updateProgress = (progress, message) => {
    setUploadProgress(Math.min(100, Math.max(0, progress)))
    if (message) setUploadMessage(message)
  }

  const finishUpload = () => {
    setUploadProgress(100)
    setTimeout(() => {
      setIsUploading(false)
      setUploadProgress(0)
      setUploadMessage('')
    }, 500)
  }

  const cancelUpload = () => {
    setIsUploading(false)
    setUploadProgress(0)
    setUploadMessage('')
  }

  return {
    uploadProgress,
    isUploading,
    uploadMessage,
    startUpload,
    updateProgress,
    finishUpload,
    cancelUpload
  }
}