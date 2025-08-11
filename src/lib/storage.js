import { supabase } from './supabase'

// Cache for signed URLs to avoid repeated requests
const urlCache = new Map()
const CACHE_DURATION = 3000000 // 50 minutes (URLs expire in 1 hour)

/**
 * Get a signed URL for a storage file
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path within the bucket
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} Signed URL
 */
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
  // Create cache key
  const cacheKey = `${bucket}/${path}`
  
  // Check if we have a valid cached URL
  const cached = urlCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url
  }

  try {
    // Get current user session for authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('User not authenticated with Supabase')
    }

    // Call the edge function to get signed URL
    const { data, error } = await supabase.functions.invoke('signed-url', {
      body: {
        bucket,
        path,
        expiresIn
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })

    if (error) {
      console.error('Error getting signed URL:', error)
      throw error
    }

    if (!data?.signedUrl) {
      throw new Error('No signed URL returned')
    }

    // Cache the URL
    urlCache.set(cacheKey, {
      url: data.signedUrl,
      expiresAt: Date.now() + (CACHE_DURATION)
    })

    return data.signedUrl

  } catch (error) {
    console.error('Failed to get signed URL:', error)
    throw error
  }
}

/**
 * Upload a file and return the file path (not direct URL)
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path within the bucket
 * @param {File} file - File to upload
 * @returns {Promise<{path: string, fullPath: string}>} File paths
 */
export async function uploadFile(bucket, path, file) {
  try {
    // Ensure we have a valid session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('User not authenticated with Supabase')
    }

    console.log('Uploading file to bucket:', bucket, 'path:', path)
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { 
        cacheControl: '3600', 
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    console.log('File uploaded successfully:', data)

    return {
      path: data.path,
      fullPath: data.fullPath || data.path
    }

  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

/**
 * Delete a file from storage
 * @param {string} bucket - Storage bucket name  
 * @param {string} path - File path within the bucket
 * @returns {Promise<void>}
 */
export async function deleteFile(bucket, path) {
  try {
    // Clear from cache first
    const cacheKey = `${bucket}/${path}`
    urlCache.delete(cacheKey)

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error

  } catch (error) {
    console.error('Delete error:', error)
    throw error
  }
}

/**
 * Extract bucket and path from a storage URL
 * @param {string} url - Full storage URL
 * @returns {{bucket: string, path: string} | null}
 */
export function parseStorageUrl(url) {
  try {
    // Match pattern: /storage/v1/object/public/BUCKET/PATH
    const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/)
    if (match) {
      return {
        bucket: match[1],
        path: decodeURIComponent(match[2])
      }
    }
    return null
  } catch (error) {
    console.error('Error parsing storage URL:', error)
    return null
  }
}

/**
 * Clear all cached URLs
 */
export function clearUrlCache() {
  urlCache.clear()
}