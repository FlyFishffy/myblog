function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8" style={{ color: 'var(--text-title)' }}>关于</h1>

      <div className="rounded-lg p-8" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-bg)' }}>
            <span className="text-2xl">👋</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-title)' }}>你好，欢迎来到 FlyF1sh's Blog</h2>
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>一个热爱技术与生活的人</p>
          </div>
        </div>

        <div className="space-y-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          <p>
            这里是我的个人空间，用来记录学习笔记、技术心得和生活感悟。
          </p>

          <p>
            我相信写作是最好的学习方式之一。通过把所学所想整理成文字，不仅能加深理解，
            也希望能帮助到有同样困惑的人。
          </p>

          <p>
            博客的内容主要涵盖以下几个方面：
          </p>

          <div className="grid md:grid-cols-2 gap-4 my-6">
            <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💻</span>
                <h3 className="font-semibold" style={{ color: 'var(--text-title)' }}>技术分享</h3>
              </div>
              <ul className="text-sm space-y-1.5" style={{ color: 'var(--text-dim)' }}>
                <li>• 编程语言与框架</li>
                <li>• 系统设计与架构</li>
                <li>• 开发工具与效率</li>
                <li>• 技术趋势与思考</li>
              </ul>
            </div>

            <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📝</span>
                <h3 className="font-semibold" style={{ color: 'var(--text-title)' }}>生活随笔</h3>
              </div>
              <ul className="text-sm space-y-1.5" style={{ color: 'var(--text-dim)' }}>
                <li>• 读书笔记与书评</li>
                <li>• 日常感悟与思考</li>
                <li>• 学习方法与经验</li>
                <li>• 兴趣爱好分享</li>
              </ul>
            </div>
          </div>

          <p>
            感谢你的到来，希望这里的内容对你有所帮助。如果有任何想法或建议，欢迎随时交流！
          </p>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
