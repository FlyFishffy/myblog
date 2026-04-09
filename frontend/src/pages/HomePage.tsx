import { useState, useEffect, useMemo } from 'react'
import { fetchPosts } from '../api'
import type { Post } from '../api'
import PostCard from '../components/PostCard'

// Mock data for when backend is not running
const MOCK_POSTS: Post[] = [
  {
    id: 1,
title: '欢迎来到 FlyF1sh\'s Blog',
    slug: 'welcome-to-my-blog',
    summary: '这是我的第一篇博客文章，记录生活与技术的点滴。',
    tags: '随笔,生活',
    created_at: '2024-10-01T10:00:00',
    updated_at: '2024-10-01T10:00:00',
  },
  {
    id: 2,
    title: '现代 Web 开发的思考',
    slug: 'modern-cpp-web-dev',
    summary: '探索现代 Web 开发中的技术选型与最佳实践。',
    tags: '技术,Web开发',
    created_at: '2024-10-05T14:30:00',
    updated_at: '2024-10-05T14:30:00',
  },
  {
    id: 3,
    title: '如何打造美观的用户界面',
    slug: 'react-tailwind-ui',
    summary: '分享一些关于用户界面设计的心得与技巧。',
    tags: '设计,前端,UI',
    created_at: '2024-10-10T09:15:00',
    updated_at: '2024-10-10T09:15:00',
  },
  {
    id: 4,
    title: '甲骨文 ARM 实例部署 Gemma 4 模型',
    slug: 'oracle-arm-gemma4',
    summary: '在甲骨文云 ARM 实例上部署和运行 Gemma 4 大语言模型的完整教程。',
    tags: '技术,云计算,AI',
    created_at: '2026-04-07T10:00:00',
    updated_at: '2026-04-07T10:00:00',
  },
  {
    id: 5,
    title: 'Headscale + Tailscale 组建虚拟专用网',
    slug: 'headscale-tailscale-vpn',
    summary: '使用 Headscale 自建控制服务器，配合 Tailscale 客户端组建安全的虚拟专用网络。',
    tags: '技术,网络,运维',
    created_at: '2026-04-06T14:00:00',
    updated_at: '2026-04-06T14:00:00',
  },
  {
    id: 6,
    title: '在 Linux 上使用 Yubikey OpenPGP 应用',
    slug: 'linux-yubikey-openpgp',
    summary: '配置 Yubikey 的 OpenPGP 功能用于 SSH 认证和 Git 签名。',
    tags: '技术,安全,Linux',
    created_at: '2026-04-04T09:00:00',
    updated_at: '2026-04-04T09:00:00',
  },
  {
    id: 7,
    title: 'Alpine Linux 服务器配置指南',
    slug: 'alpine-linux-server',
    summary: '从零开始配置一台 Alpine Linux 服务器的完整指南。',
    tags: '技术,Linux,运维',
    created_at: '2026-03-17T10:00:00',
    updated_at: '2026-03-17T10:00:00',
  },
  {
    id: 8,
    title: 'Docker 多容器共享中心数据库',
    slug: 'docker-shared-database',
    summary: '在 Docker 环境中实现多个容器共享同一个数据库实例的最佳实践。',
    tags: '技术,Docker,运维',
    created_at: '2026-03-13T16:00:00',
    updated_at: '2026-03-13T16:00:00',
  },
]

const TIME_RANGES = [
  { label: '全部', value: 'all' },
  { label: '最近一周', value: '7d' },
  { label: '最近一月', value: '30d' },
  { label: '最近三月', value: '90d' },
  { label: '最近一年', value: '365d' },
]

function HomePage({ isAdmin }: { isAdmin?: boolean }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string>('全部')
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all')
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  useEffect(() => {
    fetchPosts()
      .then(data => {
        setPosts(data.posts)
        setLoading(false)
      })
      .catch(() => {
        setPosts(MOCK_POSTS)
        setUsingMock(true)
        setLoading(false)
      })
  }, [])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    posts.forEach(post => {
      if (post.tags) {
        post.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => tagSet.add(t))
      }
    })
    return ['全部', ...Array.from(tagSet)]
  }, [posts])

  const filteredPosts = useMemo(() => {
    let result = posts
    if (selectedTag !== '全部') {
      result = result.filter(post => {
        const tags = post.tags ? post.tags.split(',').map(t => t.trim()) : []
        return tags.includes(selectedTag)
      })
    }
    if (selectedTimeRange !== 'all') {
      const days = parseInt(selectedTimeRange)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      result = result.filter(post => new Date(post.created_at) >= cutoff)
    }
    return result
  }, [posts, selectedTag, selectedTimeRange])

  const activeFilterCount = (selectedTag !== '全部' ? 1 : 0) + (selectedTimeRange !== 'all' ? 1 : 0)

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Page title + filter bar */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-title)' }}>文章</h1>
          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
            共 {filteredPosts.length} 篇
            {activeFilterCount > 0 && (
              <span className="ml-2" style={{ color: 'var(--text-body)' }}>（已筛选）</span>
            )}
          </p>
        </div>

        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors"
          style={{
            backgroundColor: showFilterPanel || activeFilterCount > 0 ? 'var(--accent-bg)' : 'transparent',
            color: showFilterPanel || activeFilterCount > 0 ? 'var(--text-title)' : 'var(--text-dim)',
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          筛选
          {activeFilterCount > 0 && (
            <span
              className="text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium"
              style={{ backgroundColor: 'var(--accent-active-bg)', color: 'var(--accent-active-text)' }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilterPanel && (
        <div className="mb-8 p-5 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="text-xs mb-2 uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>时间范围</div>
              <div className="flex flex-wrap gap-2">
                {TIME_RANGES.map(range => (
                  <button
                    key={range.value}
                    onClick={() => setSelectedTimeRange(range.value)}
                    className="px-3 py-1 rounded text-xs transition-colors"
                    style={{
                      backgroundColor: selectedTimeRange === range.value ? 'var(--accent-active-bg)' : 'var(--bg-tertiary)',
                      color: selectedTimeRange === range.value ? 'var(--accent-active-text)' : 'var(--text-dim)',
                    }}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <div className="text-xs mb-2 uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>标签</div>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className="px-3 py-1 rounded text-xs transition-colors"
                    style={{
                      backgroundColor: selectedTag === tag ? 'var(--accent-active-bg)' : 'var(--bg-tertiary)',
                      color: selectedTag === tag ? 'var(--accent-active-text)' : 'var(--text-dim)',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
              <button
                onClick={() => { setSelectedTag('全部'); setSelectedTimeRange('all') }}
                className="text-xs transition-colors"
                style={{ color: 'var(--text-dim)' }}
              >
                清除所有筛选
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mock data notice */}
      {usingMock && (
        <div className="mb-6 rounded-lg p-3 flex items-start gap-3" style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}>
          <span className="text-sm">⚠️</span>
          <p className="text-xs" style={{ color: 'var(--warning-text)' }}>
            演示模式 · 后端服务未启动，当前显示示例数据
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3" style={{ color: 'var(--text-faint)' }}>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            正在加载...
          </div>
        </div>
      )}

      {!loading && filteredPosts.length === 0 && (
        <div className="text-center py-20" style={{ color: 'var(--text-ghost)' }}>
          <p className="text-lg">暂无文章</p>
          {activeFilterCount > 0 && (
            <p className="text-sm mt-2">
              尝试
              <button
                onClick={() => { setSelectedTag('全部'); setSelectedTimeRange('all') }}
                className="underline underline-offset-2 ml-1"
                style={{ color: 'var(--text-body)' }}
              >
                清除筛选条件
              </button>
            </p>
          )}
        </div>
      )}

      <div className="space-y-0">
        {filteredPosts.map(post => (
          <PostCard key={post.id} post={post} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  )
}

export default HomePage
