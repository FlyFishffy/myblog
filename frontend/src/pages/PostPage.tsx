import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { fetchPost } from '../api'
import type { Post } from '../api'

// Mock post content for when backend is not running
const MOCK_POSTS: Record<string, Post> = {
  'welcome-to-my-blog': {
    id: 1,
    title: '欢迎来到 FlyF1sh\'s Blog',
    slug: 'welcome-to-my-blog',
    summary: '这是我的第一篇博客文章，记录生活与技术的点滴。',
    content: `# 欢迎来到 FlyF1sh's Blog

很高兴你能来到这里！这是我的个人博客，用来记录和分享我的所思所想。

## 关于这个博客

这个博客是我用来：

- 记录技术学习笔记
- 分享编程心得体会
- 探讨有趣的技术话题
- 记录生活中的点滴

## 未来计划

我会持续更新博客内容，涵盖以下方面：

1. **技术分享** - 前端、后端、系统设计等
2. **学习笔记** - 读书笔记、课程总结
3. **项目实践** - 个人项目的开发过程
4. **生活随笔** - 日常感悟与思考

敬请期待更多内容！`,
    tags: '随笔,生活',
    created_at: '2024-10-01T10:00:00',
    updated_at: '2024-10-01T10:00:00',
  },
  'modern-cpp-web-dev': {
    id: 2,
    title: '现代 Web 开发的思考',
    slug: 'modern-cpp-web-dev',
    summary: '探索现代 Web 开发中的技术选型与最佳实践。',
    content: `# 现代 Web 开发的思考

Web 开发技术日新月异，如何在众多技术中做出合理的选择，是每个开发者都需要面对的问题。

## 技术选型的原则

### 1. 团队熟悉度
团队成员对技术的熟悉程度直接影响开发效率和代码质量。

### 2. 社区生态
一个活跃的社区意味着更多的学习资源、第三方库和问题解决方案。

### 3. 性能需求
不同的应用场景对性能的要求不同，需要根据实际需求来选择。

## 前端框架的演进

从最初的 jQuery 到现在的 React、Vue、Svelte，前端框架经历了巨大的变化：

- **组件化** - 将 UI 拆分为可复用的组件
- **响应式** - 数据驱动视图自动更新
- **工程化** - 完善的构建工具和开发体验

## 总结

技术选型没有银弹，关键是要根据项目需求和团队情况做出最合适的选择。`,
    tags: '技术,Web开发',
    created_at: '2024-10-05T14:30:00',
    updated_at: '2024-10-05T14:30:00',
  },
  'react-tailwind-ui': {
    id: 3,
    title: '如何打造美观的用户界面',
    slug: 'react-tailwind-ui',
    summary: '分享一些关于用户界面设计的心得与技巧。',
    content: `# 如何打造美观的用户界面

好的用户界面不仅要好看，更要好用。以下是我在实践中总结的一些经验。

## 设计原则

### 一致性
保持整个应用的视觉风格统一，包括颜色、字体、间距等。

### 层次感
通过大小、颜色深浅、间距等方式建立清晰的视觉层次。

### 留白
适当的留白可以让界面更加清爽，提升阅读体验。

## 实用技巧

1. **选择合适的配色方案** - 使用 3-5 种主要颜色
2. **注重排版** - 选择易读的字体，合理设置行高和字间距
3. **响应式设计** - 确保在不同设备上都有良好的体验
4. **微交互** - 添加适当的动画和过渡效果

## 总结

好的 UI 设计是一个不断迭代的过程，需要在美观和实用之间找到平衡。`,
    tags: '设计,前端,UI',
    created_at: '2024-10-10T09:15:00',
    updated_at: '2024-10-10T09:15:00',
  },
  'oracle-arm-gemma4': {
    id: 4,
    title: '甲骨文 ARM 实例部署 Gemma 4 模型',
    slug: 'oracle-arm-gemma4',
    summary: '在甲骨文云 ARM 实例上部署和运行 Gemma 4 大语言模型的完整教程。',
    content: `# 甲骨文 ARM 实例部署 Gemma 4 模型

本文介绍如何在甲骨文云的 ARM 实例上部署 Google 的 Gemma 4 大语言模型。

## 前置条件

- 甲骨文云账号（免费套餐即可）
- ARM 实例（A1.Flex，4 OCPU / 24GB 内存）
- Ubuntu 22.04 操作系统

## 步骤一：准备环境

\`\`\`bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv git
\`\`\`

## 步骤二：安装 Ollama

\`\`\`bash
curl -fsSL https://ollama.com/install.sh | sh
\`\`\`

## 总结

ARM 实例虽然算力有限，但对于小型模型的推理来说已经足够。`,
    tags: '技术,云计算,AI',
    created_at: '2026-04-07T10:00:00',
    updated_at: '2026-04-07T10:00:00',
  },
  'headscale-tailscale-vpn': {
    id: 5,
    title: 'Headscale + Tailscale 组建虚拟专用网',
    slug: 'headscale-tailscale-vpn',
    summary: '使用 Headscale 自建控制服务器，配合 Tailscale 客户端组建安全的虚拟专用网络。',
    content: `# Headscale + Tailscale 组建虚拟专用网

Tailscale 是一个基于 WireGuard 的零配置 VPN 方案，而 Headscale 是其控制服务器的开源替代。

## 为什么选择 Headscale？

- **数据自主** - 控制服务器完全由自己掌控
- **免费无限制** - 不受 Tailscale 免费套餐的节点数限制
- **隐私保护** - 元数据不经过第三方

## 总结

这套方案非常适合个人用户和小团队，既安全又灵活。`,
    tags: '技术,网络,运维',
    created_at: '2026-04-06T14:00:00',
    updated_at: '2026-04-06T14:00:00',
  },
  'linux-yubikey-openpgp': {
    id: 6,
    title: '在 Linux 上使用 Yubikey OpenPGP 应用',
    slug: 'linux-yubikey-openpgp',
    summary: '配置 Yubikey 的 OpenPGP 功能用于 SSH 认证和 Git 签名。',
    content: `# 在 Linux 上使用 Yubikey OpenPGP 应用

Yubikey 的 OpenPGP 功能可以将 PGP 私钥存储在硬件中，大幅提升安全性。

## 安装依赖

\`\`\`bash
sudo apt install -y gnupg2 scdaemon pcscd
\`\`\`

## 总结

硬件密钥是保护个人数字身份的最佳方式之一。`,
    tags: '技术,安全,Linux',
    created_at: '2026-04-04T09:00:00',
    updated_at: '2026-04-04T09:00:00',
  },
  'alpine-linux-server': {
    id: 7,
    title: 'Alpine Linux 服务器配置指南',
    slug: 'alpine-linux-server',
    summary: '从零开始配置一台 Alpine Linux 服务器的完整指南。',
    content: `# Alpine Linux 服务器配置指南

Alpine Linux 以其极小的体积和安全性著称，非常适合作为服务器操作系统。

## 基础配置

\`\`\`bash
apk update && apk upgrade
apk add openssh curl wget
\`\`\`

## 总结

Alpine Linux 是一个优秀的轻量级服务器系统选择。`,
    tags: '技术,Linux,运维',
    created_at: '2026-03-17T10:00:00',
    updated_at: '2026-03-17T10:00:00',
  },
  'docker-shared-database': {
    id: 8,
    title: 'Docker 多容器共享中心数据库',
    slug: 'docker-shared-database',
    summary: '在 Docker 环境中实现多个容器共享同一个数据库实例的最佳实践。',
    content: `# Docker 多容器共享中心数据库

在微服务架构中，多个服务共享数据库是常见的需求。

## 使用 Docker Network

\`\`\`bash
docker network create app-network
docker run -d --name postgres --network app-network postgres:16
\`\`\`

## 总结

合理使用 Docker 网络和数据卷，可以轻松实现容器间的数据库共享。`,
    tags: '技术,Docker,运维',
    created_at: '2026-03-13T16:00:00',
    updated_at: '2026-03-13T16:00:00',
  },
}

function PostPage({ isAdmin }: { isAdmin?: boolean }) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMock, setUsingMock] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetchPost(slug)
      .then(data => {
        setPost(data)
        setLoading(false)
      })
      .catch(() => {
        const mockPost = MOCK_POSTS[slug]
        if (mockPost) {
          setPost(mockPost)
          setUsingMock(true)
        } else {
          setError('文章未找到')
        }
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 flex items-center justify-center">
        <div className="flex items-center gap-3" style={{ color: 'var(--text-faint)' }}>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          正在加载...
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="text-6xl mb-4">📄</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-title)' }}>文章未找到</h1>
        <p className="mb-6" style={{ color: 'var(--text-faint)' }}>你访问的文章不存在。</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded transition-colors"
          style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--text-body)' }}
        >
          ← 返回首页
        </Link>
      </div>
    )
  }

  const tags = post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const date = new Date(post.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const content = post.content || ''
  const wordCount = content.length
  const readingTime = Math.max(1, Math.ceil(wordCount / 400))

  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm transition-colors mb-8"
        style={{ color: 'var(--text-faint)' }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回所有文章
      </Link>

      {/* Mock data notice */}
      {usingMock && (
        <div className="mb-6 rounded-lg p-3 flex items-start gap-3" style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}>
          <span className="text-sm">⚠️</span>
          <p className="text-xs" style={{ color: 'var(--warning-text)' }}>
            演示模式 · 当前显示示例内容
          </p>
        </div>
      )}

      {/* Post header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-title)' }}>
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
          <time>{date}</time>
          <span style={{ color: 'var(--text-separator)' }}>·</span>
          <span>{readingTime} 分钟</span>
          <span style={{ color: 'var(--text-separator)' }}>·</span>
          <span>{wordCount} 字</span>
          {tags.length > 0 && (
            <>
              <span style={{ color: 'var(--text-separator)' }}>·</span>
              <div className="flex gap-1.5">
                {tags.map(tag => (
                  <span key={tag} style={{ color: 'var(--text-dim)' }}>{tag}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Edit button for admin */}
      {isAdmin && (
        <div className="mb-6">
          <button
            onClick={() => navigate(`/edit/${post.slug}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors"
            style={{
              backgroundColor: 'var(--accent-bg)',
              color: 'var(--text-dim)',
              border: '1px solid var(--border-primary)',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            修改文章
          </button>
        </div>
      )}

      <hr style={{ borderColor: 'var(--border-primary)' }} className="mb-8" />

      <div className="prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {content}
        </ReactMarkdown>
      </div>
    </article>
  )
}

export default PostPage
