import { useState, useEffect } from 'react'
import { getSignedUrl, parseStorageUrl } from '../lib/storage'

/**
 * Hook to get secure signed URLs for storage files
 * @param {string|null} storageUrl - Original storage URL or file path
 * @param {string} defaultBucket - Default bucket if URL doesn't contain bucket info
 * @returns {{ signedUrl: string|null, loading: boolean, error: string|null }}
 */
export function useSecureUrl(storageUrl, defaultBucket = 'models') {
  const [signedUrl, setSignedUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!storageUrl) {
      setSignedUrl(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    
    async function fetchSignedUrl() {
      try {
        setLoading(true)
        setError(null)

        // Parse the storage URL to get bucket and path
        const parsed = parseStorageUrl(storageUrl)
        
        let bucket, path
        
        if (parsed) {
          // URL contains bucket and path
          bucket = parsed.bucket
          path = parsed.path
        } else {
          // Assume it's just a path, use default bucket
          bucket = defaultBucket
          path = storageUrl.startsWith('/') ? storageUrl.slice(1) : storageUrl
        }

        const url = await getSignedUrl(bucket, path)
        
        if (!cancelled) {
          setSignedUrl(url)
        }

      } catch (err) {
        console.error('Error getting signed URL:', err)
        if (!cancelled) {
          setError(err.message || 'Failed to load secure URL')
          setSignedUrl(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchSignedUrl()

    return () => {
      cancelled = true
    }
  }, [storageUrl, defaultBucket])

  return { signedUrl, loading, error }
}