import { useState, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export function useModelLoader(url) {
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!url) return

    setIsLoading(true)
    setLoadingProgress(0)
    setError(null)

    // Create a loading manager to track progress
    const manager = new THREE.LoadingManager()
    
    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100
      setLoadingProgress(progress)
    }

    manager.onLoad = () => {
      setLoadingProgress(100)
      setTimeout(() => {
        setIsLoading(false)
      }, 200)
    }

    manager.onError = (url) => {
      setError(`Failed to load: ${url}`)
      setIsLoading(false)
    }

    // Preload the model
    const loader = new THREE.GLTFLoader(manager)
    loader.load(
      url,
      () => {}, // onLoad handled by manager
      undefined, // onProgress handled by manager
      (error) => {
        setError(error.message)
        setIsLoading(false)
      }
    )

  }, [url])

  const gltf = useGLTF(url)

  return {
    scene: gltf.scene,
    loadingProgress,
    isLoading,
    error
  }
}