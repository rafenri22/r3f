import React from 'react'
import LoadingProgress from './LoadingProgress'

export default function LoadingOverlay({ 
  isVisible, 
  progress = 0, 
  message = "Loading...", 
  children 
}) {
  return (
    <div className="relative">
      {children}
      {isVisible && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <LoadingProgress progress={progress} message={message} />
          </div>
        </div>
      )}
    </div>
  )
}