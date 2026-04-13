/**
 * Strip Markdown syntax and count only visible text characters.
 * This mirrors the backend's count_markdown_words logic.
 */
export function countMarkdownWords(content: string): number {
  let text = content

  // Remove fenced code blocks (``` ... ```)
  text = text.replace(/```[\s\S]*?```/g, '')

  // Remove inline code (`...`)
  text = text.replace(/`[^`]*`/g, '')

  // Remove images ![alt](url)
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '')

  // Remove links [text](url) -> keep text
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // Remove heading markers (# ## ### etc.)
  text = text.replace(/(?:^|\n)#{1,6}\s*/g, '\n')

  // Remove bold/italic/strikethrough markers
  text = text.replace(/\*{1,3}|_{1,3}|~~/g, '')

  // Remove blockquote markers
  text = text.replace(/(?:^|\n)>+\s*/g, '\n')

  // Remove horizontal rules (---, ***, ___)
  text = text.replace(/(?:^|\n)[-*_]{3,}\s*/g, '\n')

  // Remove unordered list markers (- * +)
  text = text.replace(/(?:^|\n)\s*[-*+]\s+/g, '\n')

  // Remove ordered list markers (1. 2. etc.)
  text = text.replace(/(?:^|\n)\s*\d+\.\s+/g, '\n')

  // Remove table separators (|---|---|)
  text = text.replace(/(?:^|\n)\|?[\s:]*[-]+[\s:]*(?:\|[\s:]*[-]+[\s:]*)*\|?\s*/g, '\n')

  // Remove table pipe characters
  text = text.replace(/\|/g, ' ')

  // Remove all whitespace and count remaining characters
  text = text.replace(/\s/g, '')

  return text.length
}
