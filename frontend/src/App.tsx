import { useState, useEffect } from 'react'
import { Routes, Route, useSearchParams } from 'react-router-dom'
import { ThemeProvider } from './ThemeContext'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import PostPage from './pages/PostPage'
import AboutPage from './pages/AboutPage'
import UploadPage from './pages/UploadPage'
import EditPage from './pages/EditPage'

const AUTH_TOKEN_KEY = 'blog_admin_token'

function AppContent() {
  const [searchParams] = useSearchParams()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check URL token parameter - only valid in current session
    const token = searchParams.get('token')
    if (token === 'flyfish') {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token)
      setIsAdmin(true)
    } else if (sessionStorage.getItem(AUTH_TOKEN_KEY) === 'flyfish') {
      setIsAdmin(true)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAdmin={isAdmin} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage isAdmin={isAdmin} />} />
          <Route path="/post/:slug" element={<PostPage isAdmin={isAdmin} />} />
          <Route path="/about" element={<AboutPage />} />
          {isAdmin && <Route path="/upload" element={<UploadPage />} />}
          {isAdmin && <Route path="/edit/:slug" element={<EditPage />} />}
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
