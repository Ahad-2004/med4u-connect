import { useEffect, useState } from 'react'
import './index.css'
import ScanAndConnect from './ScanAndConnect'
import LabUpload from './LabUpload'
import DoctorPatientView from './DoctorPatientView'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './Login'
import PatientHistory from './PatientHistory'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'

function AppInner() {
  const [hospitalId] = useState('demo-hospital-123')
  const [access, setAccess] = useState(null)
  const [patientId, setPatientId] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const { user, loading, logout } = useAuth()

  useEffect(() => {
    if (!user) {
      setAccess(null)
      setPatientId('')
    }
  }, [user])

  const handleNavigate = (section) => {
    setActiveSection(section)
    // Scroll to relevant section
    const sectionMap = {
      connect: 'connect-patient-card',
      upload: 'upload-report-card',
      recent: 'recent-patients-card',
      dashboard: 'welcome-card'
    }
    const elementId = sectionMap[section]
    if (elementId) {
      const el = document.getElementById(elementId)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">Loading...</div>
  if (!user) return <Login />

  return (
    <div className="min-h-screen flex">
      <Sidebar user={user} onLogout={logout} activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main Content */}
      <main className="main-with-sidebar flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Welcome Card */}
          <div className="welcome-card mb-6" id="welcome-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Welcome, Dr. {user?.email?.split('@')[0] || 'Doctor'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Manage patient connections and upload medical reports securely
                </p>
              </div>
              <div className="hidden md:block">
                <svg className="h-16 w-16 text-blue-600 opacity-50" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left column */}
            <div className="space-y-6">
              <div className="card p-6" id="connect-patient-card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Scan or Enter Patient Code
                </h2>
                <ScanAndConnect hospitalId={hospitalId} onConnected={(a) => { setAccess(a); setPatientId(a?.userId || ''); }} />
              </div>

              <div className="card p-6" id="recent-patients-card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Recent Patients
                </h2>
                <PatientHistory doctorId={user?.uid} onSelect={(pid) => setPatientId(pid)} />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <div className="card p-6" id="upload-report-card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Upload Report
                </h2>
                {access && patientId ? (
                  <LabUpload accessToken={access.accessToken} patientId={patientId} onUploaded={() => window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Report uploaded successfully' } }))} />
                ) : (
                  <div className="empty-state">
                    <svg className="h-12 w-12 mx-auto text-gray-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Connect to a patient to enable report uploads
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patient Overview - Full Width */}
          <div className="mt-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Patient Overview
              </h2>
              {access && patientId ? (
                <DoctorPatientView accessToken={access.accessToken} patientId={patientId} />
              ) : (
                <div className="empty-state">
                  <svg className="h-12 w-12 mx-auto text-gray-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <path d="M20 8v6m3-3h-6" />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Connect to a patient to view their profile, medications, and recent reports
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

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
