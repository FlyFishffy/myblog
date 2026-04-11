import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../ThemeContext'

function Header({ isAdmin }: { isAdmin?: boolean }) {
  const location = useLocation()
  const { theme, toggle } = useTheme()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)' }}>
      <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
        <span
          className="group shrink-0 cursor-pointer"
          onClick={() => window.location.href = '/'}
        >
          <span className="text-xl font-bold transition-colors tracking-wide" style={{ color: 'var(--text-title)' }}>
            FlyF1sh's Blog
          </span>
        </span>

        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-2">
            <Link
              to="/"
              className="text-sm transition-colors py-1 px-2 rounded"
              style={{
                color: isActive('/') ? 'var(--text-title)' : 'var(--text-dim)',
                textDecoration: isActive('/') ? 'underline' : 'none',
                textUnderlineOffset: '4px',
              }}
            >
              文章
            </Link>
            <Link
              to="/about"
              className="text-sm transition-colors py-1 px-2 rounded"
              style={{
                color: isActive('/about') ? 'var(--text-title)' : 'var(--text-dim)',
                textDecoration: isActive('/about') ? 'underline' : 'none',
                textUnderlineOffset: '4px',
              }}
            >
              关于
            </Link>
            {isAdmin && (
              <Link
                to="/upload"
                className="text-sm transition-colors py-1 px-2 rounded"
                style={{
                  color: isActive('/upload') ? 'var(--text-title)' : 'var(--text-dim)',
                  textDecoration: isActive('/upload') ? 'underline' : 'none',
                  textUnderlineOffset: '4px',
                }}
              >
                上传
              </Link>
            )}
          </nav>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--text-dim)' }}
            title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
