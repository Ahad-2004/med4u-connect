import { useEffect } from 'react'

export default function Toast({ open, message, type = 'success', onClose }) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => onClose && onClose(), 3000)
    return () => clearTimeout(t)
  }, [open, onClose])

  if (!open) return null
  const color = type === 'success' ? 'bg-blue-600' : type === 'error' ? 'bg-rose-600' : 'bg-gray-800'
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div className={`text-white ${color} shadow-lg rounded-lg px-5 py-3 text-sm font-medium`}>{message}</div>
    </div>
  )
}
