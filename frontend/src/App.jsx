import { useEffect, useState } from 'react'
import './index.css'
import ScanAndConnect from './ScanAndConnect'
import LabUpload from './LabUpload'
import DoctorPatientView from './DoctorPatientView'
import CodeConnect from './CodeConnect'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './Login'
import PatientHistory from './PatientHistory'

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
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Med4U Connect</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>
            <button className="btn btn-secondary" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            <div className="card p-4">
              <h2 className="text-lg font-medium mb-3">Scan or Enter Patient Code</h2>
              <div className="space-y-3">
                <ScanAndConnect hospitalId={hospitalId} onConnected={(a) => { setAccess(a); setPatientId(a?.userId || ''); }} />
                <CodeConnect hospitalId={hospitalId} onConnected={(a) => { setAccess(a); setPatientId(a?.userId || ''); }} />
              </div>
            </div>
            <div className="card p-4">
              <h2 className="text-lg font-medium mb-3">Recent Patients</h2>
              <PatientHistory doctorId={user?.uid} onSelect={(pid) => setPatientId(pid)} />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="card p-4">
              <h2 className="text-lg font-medium mb-3">Upload Report</h2>
              {access && patientId ? (
                <LabUpload accessToken={access.accessToken} patientId={patientId} />
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
