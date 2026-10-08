/**
 * 回复正文的拼装规则（纯函数，便于单测）
 *
 * GitHub Discussions 只支持两层回复：`addDiscussionComment` 的 `replyToId`
 * 只能指向顶层评论，指向一条回复会被拒绝：
 *   "Parent comment is already in a thread, cannot reply to it"
 *
 * 所以「回复某条回复」只能靠正文里的 `@作者` 提及来表达指向、并触发对方通知，
 * 引用块则负责让其他读者看懂上下文。
 */

/** 规范化正文里的换行，避免 Windows 的 \r\n 让引用块出现多余空行 */
function normalize(body: string | null | undefined): string {
  return (body ?? '').replace(/\r\n/g, '\n')
}

/**
 * 生成 `@作者` 提及行（末尾留一个空行，方便接着写正文）。
 * 没有作者时返回空串。
 */
export function formatMention(login?: string | null): string {
  const name = (login ?? '').trim()
  return name ? `@${name}\n\n` : ''
}

/**
 * 生成引用块：每行加 `> ` 前缀，末尾留一个空行。
 * 空白正文返回空串（调用方可以直接判断要不要渲染引用条）。
 */
export function formatQuoteBlock(body?: string | null): string {
  const raw = normalize(body)
  if (raw.trim() === '') return ''
  const lines = raw.split('\n').map((line) => `> ${line}`.trimEnd())
  return `${lines.join('\n')}\n\n`
}

/**
 * 拼装最终发送的 Markdown：提及行 + 引用块 + 用户自己写的内容。
 * 三段都可以为空，全空时返回空串（调用方据此判断"内容为空"）。
 */
export function buildReplyBody(parts: {
  mention?: string | null
  quote?: string | null
  draft?: string | null
}): string {
  const head = `${parts.mention ?? ''}${parts.quote ?? ''}`
  const draft = (parts.draft ?? '').trim()
  if (!draft) return head.trimEnd()
  return `${head}${draft}`
}

/** 取正文的首行摘要，用于紧凑提示（折叠多余空白、超长截断） */
export function summarizeBody(body: string | null | undefined, max = 48): string {
  const firstLine = normalize(body)
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line !== '')
  if (!firstLine) return ''
  return firstLine.length > max ? `${firstLine.slice(0, max)}…` : firstLine
}
