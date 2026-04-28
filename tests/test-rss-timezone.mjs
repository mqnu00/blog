import moment from 'moment'
import { Feed } from 'feed'

// 模拟测试数据 - 使用你文章中的日期格式
const testDate = '2025-04-28 10:36:24'

console.log('=== 时区问题测试 ===\n')
console.log('GitHub Actions 环境时区:', Intl.DateTimeFormat().resolvedOptions().timeZone)
console.log('输入日期:', testDate)
console.log('输入日期实际含义: 北京时间 (UTC+8)\n')

// ✅ 正确做法 - 明确指定输入字符串是北京时间
const correctDate = moment(testDate + '+0800', 'YYYY-MM-DD HH:mm:ssZ')

console.log('✅ 正确做法 (明确输入为北京时间):')
console.log('   原始输入:', testDate)
console.log('   Moment 对象:', correctDate.format('YYYY-MM-DD HH:mm:ss Z'))
console.log('   格式化为 ISO UTC:', correctDate.toISOString())
console.log('   RSS 中显示:', correctDate.format('ddd, DD MMM YYYY HH:mm:ss ZZ'))

console.log('\n=== RSS Feed 生成 ===\n')

const feed = new Feed({
  title: '你的博客标题',
  description: '博客描述',
  id: 'https://your-blog.com/',
  link: 'https://your-blog.com/',
  language: 'zh-CN',
  updated: correctDate.toDate(),
  copyright: 'All rights reserved',
  feedLinks: {
    rss2: 'https://your-blog.com/rss.xml',
  },
})

// 添加文章示例
feed.addItem({
  title: '文章标题',
  id: 'https://your-blog.com/post/1',
  link: 'https://your-blog.com/post/1',
  description: '文章描述',
  content: '文章内容',
  date: correctDate.toDate(), // 直接使用 toDate() 转换
  // 如果不使用 toDate()，也可以直接传 moment 对象
  // date: correctDate,
})

const rss = feed.rss2()
const pubDateMatch = rss.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]
console.log('生成的 RSS pubDate:', pubDateMatch)
console.log('✨ 这个时间会正确显示为读者本地时区的时间')