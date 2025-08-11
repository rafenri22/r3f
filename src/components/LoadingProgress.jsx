import React from 'react'

export default function LoadingProgress({ progress = 0, message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xs mb-2">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{message}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </div>
  )
}