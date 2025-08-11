import React from 'react'
import { useSecureUrl } from '../hooks/useSecureUrl'

export default function SecureImage({ 
  src, 
  bucket = 'thumbnails',
  alt = '',
  className = '',
  onError,
  onLoad,
  fallback = null,
  ...props 
}) {
  const { signedUrl, loading, error } = useSecureUrl(src, bucket)

  if (loading) {
    return (
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`} {...props}>
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    )
  }

  if (error || !signedUrl) {
    if (fallback) {
      return fallback
    }
    
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`} {...props}>
        <span className="text-gray-500 text-sm">Failed to load</span>
      </div>
    )
  }

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={className}
      onError={onError}
      onLoad={onLoad}
      {...props}
    />
  )
}