import { visit } from 'unist-util-visit'

/**
 * Custom rehype plugin to add indentation to lines that start with
 * letter or roman numeral list markers like:
 * a. b. c. / A. B. C. / i. ii. iii. iv.
 * (when they appear as plain text, not inside <ol>/<ul>)
 *
 * With remark-breaks enabled, single newlines become <br> elements.
 * So a paragraph like:
 *   "前置声明优点：\na. 内容\nb. 内容"
 * becomes:
 *   <p>前置声明优点：<br>a. 内容<br>b. 内容</p>
 *
 * This plugin wraps text nodes that start with list markers
 * (and follow a <br>) in a <span class="custom-list-indent">.
 */

// Match: a. b. c. ... z. / A. B. ... Z. (single letter followed by . or ))
const LETTER_RE = /^([a-zA-Z])[\.\)]\s/
// Match: i. ii. iii. iv. v. vi. vii. viii. ix. x. xi. xii. (roman numerals)
const ROMAN_RE = /^(i{1,3}|iv|vi{0,3}|ix|xi{0,2}|xii)[\.\)]\s/i

function startsWithListMarker(text: string): boolean {
  const trimmed = text.trimStart()
  return LETTER_RE.test(trimmed) || ROMAN_RE.test(trimmed)
}

export default function rehypeCustomListIndent() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName !== 'p') return
      if (!node.children || node.children.length === 0) return

      const newChildren: any[] = []
      let prevWasBr = false

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]

        if (child.type === 'element' && child.tagName === 'br') {
          prevWasBr = true
          newChildren.push(child)
          continue
        }

        // Check if this text node follows a <br> and starts with a list marker
        if (prevWasBr && child.type === 'text' && startsWithListMarker(child.value)) {
          // Collect all nodes until the next <br> or end
          const spanChildren: any[] = [child]
          let j = i + 1
          while (j < node.children.length) {
            const next = node.children[j]
            if (next.type === 'element' && next.tagName === 'br') break
            spanChildren.push(next)
            j++
          }

          // Wrap in a span with indent class
          newChildren.push({
            type: 'element',
            tagName: 'span',
            properties: { className: ['custom-list-indent'] },
            children: spanChildren
          })

          // Skip the nodes we already consumed
          i = j - 1
          prevWasBr = false
          continue
        }

        prevWasBr = false
        newChildren.push(child)
      }

      node.children = newChildren
    })
  }
}