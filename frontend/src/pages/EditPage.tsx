import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { fetchPost, updatePost } from '../api'

const AUTH_TOKEN_KEY = 'blog_admin_token'

function EditPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  useEffect(() => {
    if (!slug) return
    fetchPost(slug)
      .then(post => {
        setTitle(post.title)
        setSummary(post.summary || '')
        setTags(post.tags || '')
        setContent(post.content || '')
        setLoading(false)
      })
      .catch(() => {
        setError('无法加载文章')
        setLoading(false)
      })
  }, [slug])

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('标题和正文为必填项')
      return
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
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
      navigate(`/post/${slug}`)
    } catch (e: any) {
      setError(e.message || '更新失败')
    } finally {
      setSubmitting(false)
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
            {submitting ? '保存中...' : '保存修改'}
          </button>
          <button
            onClick={() => navigate(`/post/${slug}`)}
            className="px-4 py-2.5 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--text-dim)' }}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditPage
