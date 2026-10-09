import { describe, expect, it } from 'vitest'
import {
  buildReplyBody,
  formatMention,
  formatQuoteBlock,
  summarizeBody,
} from '../blog/.vitepress/utils/discussion/quote'

describe('formatMention', () => {
  it('生成 @提及 并留出空行', () => {
    expect(formatMention('bob')).toBe('@bob\n\n')
  })

  it('没有作者时返回空串', () => {
    expect(formatMention(null)).toBe('')
    expect(formatMention('   ')).toBe('')
  })
})

describe('formatQuoteBlock', () => {
  it('每行加 > 前缀并留出空行', () => {
    expect(formatQuoteBlock('第一行\n第二行')).toBe('> 第一行\n> 第二行\n\n')
  })

  it('兼容 Windows 换行，不产生多余空行', () => {
    expect(formatQuoteBlock('第一行\r\n第二行')).toBe('> 第一行\n> 第二行\n\n')
  })

  it('空正文返回空串，调用方可以据此不渲染引用条', () => {
    expect(formatQuoteBlock('')).toBe('')
    expect(formatQuoteBlock('   \n  ')).toBe('')
  })
})

describe('buildReplyBody', () => {
  it('提及 + 引用 + 正文 依次拼接，正文首尾空白被裁掉', () => {
    expect(
      buildReplyBody({
        mention: formatMention('bob'),
        quote: formatQuoteBlock('原评论'),
        draft: '  我的回复  ',
      }),
    ).toBe('@bob\n\n> 原评论\n\n我的回复')
  })

  it('取消引用后只剩提及与正文（回复某条回复时必须保留提及，否则对方收不到通知）', () => {
    expect(buildReplyBody({ mention: formatMention('bob'), quote: '', draft: '只回复你' })).toBe(
      '@bob\n\n只回复你',
    )
  })

  it('只有引用、没写正文时也能发送（等价于转述）', () => {
    expect(buildReplyBody({ quote: formatQuoteBlock('原评论'), draft: '' })).toBe('> 原评论')
  })

  it('三段全空时返回空串，用于拦截空发送', () => {
    expect(buildReplyBody({ mention: '', quote: '', draft: '   ' })).toBe('')
  })
})

describe('summarizeBody', () => {
  it('取首个非空行并截断', () => {
    expect(summarizeBody('\n\n这是第一行\n第二行')).toBe('这是第一行')
    expect(summarizeBody('a'.repeat(60), 10)).toBe(`${'a'.repeat(10)}…`)
  })

  it('空正文返回空串', () => {
    expect(summarizeBody(null)).toBe('')
  })
})
