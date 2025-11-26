import { useEffect, useState } from 'react'
import './index.css'
import ScanAndConnect from './ScanAndConnect'
import LabUpload from './LabUpload'
import DoctorPatientView from './DoctorPatientView'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './Login'
import PatientHistory from './PatientHistory'
import Navbar from './components/Navbar'
import Toast from './components/Toast'

function AppInner() {
  const [hospitalId] = useState('demo-hospital-123')
  const [access, setAccess] = useState(null)
  const [patientId, setPatientId] = useState('')
  const { user, loading, logout } = useAuth()

  useEffect(() => {
    if (!user) {
      setAccess(null)
      setPatientId('')
    }
  }, [user])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">Loading...</div>
  if (!user) return <Login />

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={logout} />

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            <div className="card p-4">
              <h2 className="text-lg font-medium mb-3">Scan or Enter Patient Code</h2>
              <div className="space-y-3">
                <ScanAndConnect hospitalId={hospitalId} onConnected={(a) => { setAccess(a); setPatientId(a?.userId || ''); }} />
              </div>
            </div>
            <div className="card p-4">
              <h2 className="text-lg font-medium mb-3">Recent Patients</h2>
              <PatientHistory doctorId={user?.uid} onSelect={(pid) => setPatientId(pid)} />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="card p-4" id="upload-report-card">
              <h2 className="text-lg font-medium mb-3">Upload Report</h2>
              {access && patientId ? (
                <LabUpload accessToken={access.accessToken} patientId={patientId} onUploaded={() => window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Report uploaded successfully' } }))} />
              ) : (
                <div className="text-sm text-gray-500">Connect to a patient to enable uploads.</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="card p-4">
            <h2 className="text-lg font-medium mb-3">Patient Overview</h2>
            {access && patientId ? (
              <DoctorPatientView accessToken={access.accessToken} patientId={patientId} />
            ) : (
              <div className="text-sm text-gray-500">Connect to view profile, meds, and recent reports.</div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button className="btn btn-primary shadow-xl rounded-full h-14 w-14 p-0" title="Upload Report" onClick={() => {
          const el = document.getElementById('upload-report-card')
          if (el) el.scrollIntoView({ behavior: 'smooth' })
        }}>
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5v14m-7-7h14"/></svg>
        </button>
      </div>

      {/* Toast listener */}
      <ToastHost />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

export default App

function ToastHost() {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [type, setType] = useState('success')
  useEffect(() => {
    const handler = (e) => {
      setType(e.detail?.type || 'success')
      setMsg(e.detail?.message || '')
      setOpen(true)
    }
    window.addEventListener('toast', handler)
    return () => window.removeEventListener('toast', handler)
  }, [])
  return <Toast open={open} type={type} message={msg} onClose={() => setOpen(false)} />
}
