import { useState, useEffect } from 'react'

export function useModel3DLoader(url) {
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadingMessage, setLoadingMessage] = useState('')

  useEffect(() => {
    if (!url) {
      setLoadingProgress(0)
      setIsLoading(false)
      setError(null)
      setLoadingMessage('')
      return
    }

    setIsLoading(true)
    setLoadingProgress(0)
    setError(null)
    setLoadingMessage('Loading 3D model...')

    // Simulate loading progress since we can't easily track GLTF loading progress
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      if (progress < 90) {
        setLoadingProgress(progress)
        setLoadingMessage(`Loading model resources... ${Math.round(progress)}%`)
      }
    }, 200)

    // Simulate completion after 2 seconds
    setTimeout(() => {
      clearInterval(interval)
      setLoadingProgress(100)
      setLoadingMessage('Model loaded successfully!')
      setTimeout(() => {
        setIsLoading(false)
        setLoadingMessage('')
      }, 500)
    }, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [url])

  return {
    loadingProgress,
    isLoading,
    loadingMessage,
    error
  }
}