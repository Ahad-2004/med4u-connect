import ThemeToggle from './ThemeToggle'

export default function Navbar({ user, onLogout }) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-teal-600" />
          <h1 className="text-xl font-semibold tracking-tight">Med4U Connect</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="btn btn-secondary h-9 w-9 rounded-full p-0"
            onClick={() => window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'No notifications yet' } }))}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a2 2 0 002-2H10a2 2 0 002 2z"/><path d="M18 16v-5a6 6 0 10-12 0v5l-2 2h16l-2-2z"/></svg>
          </button>
          <ThemeToggle />
          <div className="flex items-center gap-2 pl-2 ml-2 border-l border-gray-200 dark:border-gray-800">
            <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">{user?.email}</span>
            <div className="h-9 w-9 rounded-full bg-blue-600 text-white grid place-items-center text-sm font-semibold">
              {user?.email ? user.email[0]?.toUpperCase() : 'D'}
            </div>
            <button className="btn btn-secondary" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </div>
    </header>
  )
}
