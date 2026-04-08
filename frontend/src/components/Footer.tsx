function Footer() {
  return (
    <footer className="mt-auto" style={{ borderTop: '1px solid var(--border-primary)' }}>
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center justify-center">
          <div className="text-xs" style={{ color: 'var(--text-ghost)' }}>
© {new Date().getFullYear()} FlyF1sh's Blog
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
