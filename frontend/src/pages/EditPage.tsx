import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeHighlight from 'rehype-highlight'
import rehypeCustomListIndent from '../utils/remarkCustomLists'
import { fetchPost, updatePost, deletePost } from '../api'
import ConfirmModal from '../components/ConfirmModal'

const AUTH_TOKEN_KEY = 'blog_admin_token'
const EDIT_DRAFT_KEY_PREFIX = 'blog_edit_draft_'

interface DraftData {
  title: string
  summary: string
  tags: string
  content: string
}

function EditPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Draft save modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const pendingNavPath = useRef<string | null>(null)
  const skipPrompt = useRef(false)
  // Store original data from server to detect changes
  const originalData = useRef<DraftData | null>(null)

  const draftKey = `${EDIT_DRAFT_KEY_PREFIX}${slug}`

  // Check if form has been modified from original
  const hasChanges = useCallback(() => {
    if (!originalData.current) return false
    const orig = originalData.current
    return (
      title !== orig.title ||
      summary !== orig.summary ||
      tags !== orig.tags ||
      content !== orig.content
    )
  }, [title, summary, tags, content])

  // Save draft to sessionStorage
  const saveDraft = useCallback(() => {
    const draft: DraftData = { title, summary, tags, content }
    sessionStorage.setItem(draftKey, JSON.stringify(draft))
  }, [title, summary, tags, content, draftKey])

  useEffect(() => {
    if (!slug) return
    fetchPost(slug)
      .then(post => {
        const serverData: DraftData = {
          title: post.title,
          summary: post.summary || '',
          tags: post.tags || '',
          content: post.content || '',
        }
        originalData.current = serverData

        // Check if there's a saved draft for this article
        const saved = sessionStorage.getItem(`${EDIT_DRAFT_KEY_PREFIX}${slug}`)
        if (saved) {
          try {
            const draft: DraftData = JSON.parse(saved)
            setTitle(draft.title || '')
            setSummary(draft.summary || '')
            setTags(draft.tags || '')
            setContent(draft.content || '')
            sessionStorage.removeItem(`${EDIT_DRAFT_KEY_PREFIX}${slug}`)
          } catch {
            setTitle(serverData.title)
            setSummary(serverData.summary)
            setTags(serverData.tags)
            setContent(serverData.content)
            sessionStorage.removeItem(`${EDIT_DRAFT_KEY_PREFIX}${slug}`)
          }
        } else {
          setTitle(serverData.title)
          setSummary(serverData.summary)
          setTags(serverData.tags)
          setContent(serverData.content)
        }
        setLoading(false)
      })
      .catch(() => {
        setError('无法加载文章')
        setLoading(false)
      })
  }, [slug])

  // Intercept navigation via Header links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http')) return

      // Only intercept if navigating away from edit page and form has changes
      if (location.pathname.startsWith('/edit/') && !location.pathname.startsWith(href) && hasChanges() && !skipPrompt.current) {
        e.preventDefault()
        e.stopPropagation()
        pendingNavPath.current = href
        setShowLeaveModal(true)
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [location.pathname, hasChanges])

  // Handle browser back/refresh with beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges() && !skipPrompt.current) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

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
    sessionStorage.removeItem(draftKey)
    setShowLeaveModal(false)
    skipPrompt.current = true
    if (pendingNavPath.current) {
      navigate(pendingNavPath.current)
      pendingNavPath.current = null
    }
  }

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('标题和正文为必填项')
      return
    }

    const token = sessionStorage.getItem(AUTH_TOKEN_KEY)
    if (!token || !slug) {
      setError('未授权，请通过 token 参数访问')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await updatePost(
        slug,
        { title: title.trim(), slug, summary: summary.trim(), tags: tags.trim(), content },
        token
      )
      // Clear draft on successful submit
      sessionStorage.removeItem(draftKey)
      skipPrompt.current = true
      navigate(`/post/${slug}`)
    } catch (e: any) {
      setError(e.message || '更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY)
    if (!token || !slug) {
      setError('未授权，请通过 token 参数访问')
      return
    }

    setDeleting(true)
    setError(null)

    try {
      await deletePost(slug, token)
      navigate('/')
    } catch (e: any) {
      setError(e.message || '删除失败')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-primary)',
    color: 'var(--text-body)',
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 flex items-center justify-center">
        <div className="flex items-center gap-3" style={{ color: 'var(--text-faint)' }}>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          正在加载文章...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-title)' }}>修改文章</h1>
        <span className="text-sm px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--text-dim)' }}>
          {slug}
        </span>
      </div>

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
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeHighlight, rehypeCustomListIndent]}>{content}</ReactMarkdown>
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
            {submitting ? '保存中...' : '保存修改'}
          </button>
          <button
            onClick={() => {
              if (hasChanges()) {
                pendingNavPath.current = `/post/${slug}`
                setShowLeaveModal(true)
              } else {
                navigate(`/post/${slug}`)
              }
            }}
            className="px-4 py-2.5 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--text-dim)' }}
          >
            取消
          </button>

          <div className="flex-1" />

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2.5 rounded-lg text-sm transition-colors"
              style={{ color: '#c44' }}
            >
              删除文章
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: '#c44' }}>确认删除？</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#c44', color: '#fff' }}
              >
                {deleting ? '删除中...' : '确认'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: 'var(--text-dim)' }}
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leave confirmation modal */}
      <ConfirmModal
        open={showLeaveModal}
        title="保存草稿"
        message="当前文章有未保存的修改，是否保存为草稿？保存后下次进入编辑页面时可以继续编辑。"
        confirmText="保存草稿"
        cancelText="不保存"
        onConfirm={handleSaveDraft}
        onCancel={handleDiscardDraft}
      />
    </div>
  )
}

export default EditPage
