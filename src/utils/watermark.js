export async function addWatermark(canvas, width = 1920, height = 1080) {
  // Create a temporary canvas for watermarking
  const watermarkCanvas = document.createElement('canvas')
  const ctx = watermarkCanvas.getContext('2d')
  
  watermarkCanvas.width = width
  watermarkCanvas.height = height
  
  // Draw the original image from the 3D canvas
  ctx.drawImage(canvas, 0, 0, width, height)
  
  // Add semi-transparent dark overlay at bottom for watermark
  const overlayHeight = 100
  const gradient = ctx.createLinearGradient(0, height - overlayHeight, 0, height)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.4)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, height - overlayHeight, width, overlayHeight)
  
  // Configure text style
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 1
  
  // Company name (larger)
  const companyFontSize = Math.floor(width * 0.020) // Slightly bigger font
  ctx.font = `bold ${companyFontSize}px Inter, Arial, sans-serif`
  ctx.fillText(``, width / 2, height - 50)
  
  // Developer credit (smaller with more spacing)
  const devFontSize = Math.floor(width * 0.014)
  ctx.font = `${devFontSize}px Inter, Arial, sans-serif`
  ctx.fillStyle = '#e2e8f0'
  ctx.fillText('PT. Trijaya Agung Lestari', width / 2, height - 20)
  
  // Reset shadow
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  
  return watermarkCanvas.toDataURL('image/png', 0.95)
}