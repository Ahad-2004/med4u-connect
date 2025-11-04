import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button aria-label="Toggle theme" onClick={toggle} className="btn btn-secondary h-9 w-9 rounded-full p-0 flex items-center justify-center">
      {dark ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13A9 9 0 1111 2.36 7 7 0 1021.64 13z"/></svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M5 12a7 7 0 1014 0 7 7 0 00-14 0zm7-9a1 1 0 011 1v2a1 1 0 01-2 0V4a1 1 0 011-1zm0 18a1 1 0 011 1v2a1 1 0 01-2 0v-2a1 1 0 011-1zm9-9a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM6 12a1 1 0 01-1 1H3a1 1 0 110-2h2a1 1 0 011 1zm12.364 7.364a1 1 0 010 1.414l-1.415 1.414a1 1 0 11-1.414-1.414l1.415-1.414a1 1 0 011.414 0zM7.05 5.636a1 1 0 010 1.414L5.636 8.464A1 1 0 114.222 7.05L5.636 5.636A1 1 0 017.05 5.636zm11.314 0a1 1 0 010 1.414L16.95 8.464a1 1 0 01-1.414-1.414L16.95 5.636a1 1 0 011.414 0zM7.05 18.364a1 1 0 010 1.414L5.636 21.192a1 1 0 11-1.414-1.414L5.636 18.364a1 1 0 011.414 0z"/></svg>
      )}
    </button>
  )
}
