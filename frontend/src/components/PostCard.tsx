import { Link } from 'react-router-dom'
import type { Post } from '../api'

interface PostCardProps {
  post: Post
  isAdmin?: boolean
}

function PostCard({ post, isAdmin }: PostCardProps) {
  const date = new Date(post.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const content = post.content || post.summary || ''
  const wordCount = content.length
  const readingTime = Math.max(1, Math.ceil(wordCount / 400))

  const tags = post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div className="group relative">
      <Link to={`/post/${post.slug}`} className="block">
        <article
          className="py-5 -mx-4 px-4 transition-colors rounded"
          style={{ borderBottom: '1px solid var(--border-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {/* Title */}
          <h2 className="text-lg font-semibold transition-colors mb-1.5" style={{ color: 'var(--text-title)' }}>
            {post.title}
          </h2>

          {/* Meta info line */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
            <time>{date}</time>
            <span style={{ color: 'var(--text-separator)' }}>·</span>
            <span>{readingTime} 分钟</span>
            <span style={{ color: 'var(--text-separator)' }}>·</span>
            <span>{wordCount} 字</span>
            {tags.length > 0 && (
              <>
                <span style={{ color: 'var(--text-separator)' }}>·</span>
                <div className="flex gap-1.5">
                  {tags.slice(0, 3).map(tag => (
                    <span key={tag} style={{ color: 'var(--text-dim)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </article>
      </Link>

      {/* Edit button - only visible for admin */}
      {isAdmin && (
        <Link
          to={`/edit/${post.slug}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1.5 rounded text-xs"
          style={{
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--text-dim)',
            border: '1px solid var(--border-primary)',
          }}
          onClick={e => e.stopPropagation()}
        >
          修改
        </Link>
      )}
    </div>
  )
}

export default PostCard
