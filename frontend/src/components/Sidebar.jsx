import { useState } from 'react'
import ThemeToggle from './ThemeToggle'

export default function Sidebar({ user, onLogout, activeSection, onNavigate }) {
    const [collapsed, setCollapsed] = useState(false)

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
        { id: 'connect', label: 'Connect Patient', icon: QRIcon },
        { id: 'upload', label: 'Upload Reports', icon: UploadIcon },
        { id: 'recent', label: 'Recent Patients', icon: UsersIcon },
    ]

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <img
                    src="/med4u_connect_logo.png"
                    alt="Med4U Connect"
                    className="h-25 w-auto"
                />
                <div className="flex-1">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Med4U Connect</h1>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Doctor Portal</p>
                </div>
            </div>

            {/* Doctor Profile */}
            <div className="doctor-profile">
                <div className="avatar">
                    {user?.email ? user.email[0]?.toUpperCase() : 'D'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        Dr. {user?.email?.split('@')[0] || 'Doctor'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate && onNavigate(item.id)}
                            className={`sidebar-nav-item w-full ${activeSection === item.id ? 'active' : ''}`}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <ThemeToggle />
                <button
                    onClick={onLogout}
                    className="btn btn-secondary w-full justify-center"
                >
                    <LogoutIcon />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    )
}

// Icons
function HomeIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <path d="M9 22V12h6v10" />
        </svg>
    )
}

function QRIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <path d="M14 14h7v7h-7z" />
        </svg>
    )
}

function UploadIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <path d="M17 8l-5-5-5 5" />
            <path d="M12 3v12" />
        </svg>
    )
}

function UsersIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
    )
}

function LogoutIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
        </svg>
    )
}
