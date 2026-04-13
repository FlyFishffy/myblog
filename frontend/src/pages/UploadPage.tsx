import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { createPost } from '../api'
import ConfirmModal from '../components/ConfirmModal'

const AUTH_TOKEN_KEY = 'blog_admin_token'
const DRAFT_KEY = 'blog_upload_draft'

interface DraftData {
  title: string
  slug: string
  summary: string
  tags: string
  content: string
}

function UploadPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [summary, setSummary] = useState('')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  // Draft save modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const pendingNavPath = useRef<string | null>(null)
  const skipPrompt = useRef(false)

  // Check if form has content
  const hasContent = useCallback(() => {
    return !!(title.trim() || slug.trim() || summary.trim() || tags.trim() || content.trim())
  }, [title, slug, summary, tags, content])

  // Load draft from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        const draft: DraftData = JSON.parse(saved)
        setTitle(draft.title || '')
        setSlug(draft.slug || '')
        setSummary(draft.summary || '')
        setTags(draft.tags || '')
        setContent(draft.content || '')
        // Clear draft after restoring
        sessionStorage.removeItem(DRAFT_KEY)
      } catch {
        sessionStorage.removeItem(DRAFT_KEY)
      }
    }
  }, [])

  // Save draft to sessionStorage
  const saveDraft = useCallback(() => {
    const draft: DraftData = { title, slug, summary, tags, content }
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [title, slug, summary, tags, content])

  // Intercept navigation via Header links
  useEffect(() => {
    // Override click events on internal links to intercept navigation
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http')) return

      // Only intercept if navigating away from /upload and form has content
      if (location.pathname === '/upload' && href !== '/upload' && hasContent() && !skipPrompt.current) {
        e.preventDefault()
        e.stopPropagation()
        pendingNavPath.current = href
        setShowLeaveModal(true)
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [location.pathname, hasContent])

  // Handle browser back/refresh with beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasContent() && !skipPrompt.current) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasContent])

  // Modal: save draft and navigate
  const handleSaveDraft = () => {
    saveDraft()
    setShowLeaveModal(false)
    skipPrompt.current = true
    if (pendingNavPath.current) {
      navigate(pendingNavPath.current)
      pendingNavPath.current = null
    }
  }

  // Modal: discard and navigate
  const handleDiscardDraft = () => {
    sessionStorage.removeItem(DRAFT_KEY)
    setShowLeaveModal(false)
    skipPrompt.current = true
    if (pendingNavPath.current) {
      navigate(pendingNavPath.current)
      pendingNavPath.current = null
    }
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!title.trim() || !slug.trim() || !content.trim()) {
      setError('标题、Slug 和正文为必填项')
      return
    }

    const token = sessionStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setError('未授权，请通过 token 参数访问')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const post = await createPost(
        { title: title.trim(), slug: slug.trim(), summary: summary.trim(), tags: tags.trim(), content },
        token
      )
      // Clear draft on successful submit
      sessionStorage.removeItem(DRAFT_KEY)
      skipPrompt.current = true
      navigate(`/post/${post.slug}`)
    } catch (e: any) {
      setError(e.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-primary)',
    color: 'var(--text-body)',
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-title)' }}>上传文章</h1>

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>
            标题 <span style={{ color: '#c44' }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="文章标题"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1"
            style={{ ...inputStyle, '--tw-ring-color': 'var(--text-dim)' } as any}
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Slug <span style={{ color: '#c44' }}>*</span>
            <span className="ml-2 text-xs" style={{ color: 'var(--text-faint)' }}>URL 路径标识，如 my-first-post</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="my-first-post"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1"
            style={{ ...inputStyle, '--tw-ring-color': 'var(--text-dim)' } as any}
          />
        </div>

        {/* Summary */}
        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>摘要</label>
          <input
            type="text"
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="文章简短描述"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1"
            style={{ ...inputStyle, '--tw-ring-color': 'var(--text-dim)' } as any}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>
            标签
            <span className="ml-2 text-xs" style={{ color: 'var(--text-faint)' }}>多个标签用逗号分隔</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="技术,编程,C++"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1"
            style={{ ...inputStyle, '--tw-ring-color': 'var(--text-dim)' } as any}
          />
        </div>

        {/* Content - Edit / Preview tabs */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm" style={{ color: 'var(--text-muted)' }}>
              正文 (Markdown) <span style={{ color: '#c44' }}>*</span>
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('edit')}
                className="px-3 py-1 text-xs rounded transition-colors"
                style={{
                  backgroundColor: activeTab === 'edit' ? 'var(--accent-active-bg)' : 'var(--accent-bg)',
                  color: activeTab === 'edit' ? 'var(--accent-active-text)' : 'var(--text-dim)',
                }}
              >
                编辑
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className="px-3 py-1 text-xs rounded transition-colors"
                style={{
                  backgroundColor: activeTab === 'preview' ? 'var(--accent-active-bg)' : 'var(--accent-bg)',
                  color: activeTab === 'preview' ? 'var(--accent-active-text)' : 'var(--text-dim)',
                }}
              >
                预览
              </button>
            </div>
          </div>

          {activeTab === 'edit' ? (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="在这里写 Markdown 内容..."
              rows={20}
              className="w-full px-4 py-3 rounded-lg text-sm font-mono outline-none focus:ring-1 resize-y"
              style={{ ...inputStyle, '--tw-ring-color': 'var(--text-dim)', minHeight: '400px' } as any}
            />
          ) : (
            <div
              className="rounded-lg px-6 py-4 prose overflow-auto"
              style={{ ...inputStyle, minHeight: '400px' }}
            >
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-faint)' }}>暂无内容可预览</p>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning-border)', color: 'var(--warning-text)' }}>
            {error}
          </div>
        )}

        {/* Submit button */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--accent-active-bg)',
              color: 'var(--accent-active-text)',
            }}
          >
            {submitting ? '提交中...' : '提交文章'}
          </button>
          <button
            onClick={() => {
              if (hasContent()) {
                pendingNavPath.current = '/'
                setShowLeaveModal(true)
              } else {
                navigate('/')
              }
            }}
            className="px-4 py-2.5 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--text-dim)' }}
          >
            取消
          </button>
        </div>
      </div>

      {/* Leave confirmation modal */}
      <ConfirmModal
        open={showLeaveModal}
        title="保存草稿"
        message="当前页面有未提交的文章内容，是否保存为草稿？保存后下次进入上传页面时可以继续编辑。"
        confirmText="保存草稿"
        cancelText="不保存"
        onConfirm={handleSaveDraft}
        onCancel={handleDiscardDraft}
      />
    </div>
  )
}

export default UploadPage
