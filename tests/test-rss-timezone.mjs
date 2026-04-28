import moment from 'moment'
import { Feed } from 'feed'

// 模拟测试数据
const testDate = '2025-04-28 10:36:24'  // 一个已知的日期

console.log('=== 时区问题测试 ===\n')

// 当前（有问题的）做法
const wrongDate = moment(testDate).utcOffset(-8).toDate()
console.log('❌ 错误做法 (utcOffset(-8)):')
console.log('   输入日期:', testDate)
console.log('   输出日期:', wrongDate.toISOString())
console.log('   本地显示:', wrongDate.toString())

console.log('\n')

// 正确的做法
const correctDate = moment(testDate).utcOffset(8).toDate()
console.log('✅ 正确做法 (utcOffset(8)):')
console.log('   输入日期:', testDate)
console.log('   输出日期:', correctDate.toISOString())
console.log('   本地显示:', correctDate.toString())

console.log('\n')

// 测试 RSS Feed
const feed = new Feed({
  title: '时区测试博客',
  description: '测试 RSS 时区',
  id: 'http://example.com/',
  link: 'http://example.com/',
  language: 'zh-CN',
})

feed.addItem({
  title: '测试文章',
  id: 'http://example.com/test',
  link: 'http://example.com/test',
  description: '这是测试文章',
  date: correctDate  // 使用正确的时间
})

console.log('=== 生成的 RSS 片段 ===\n')
const rssOutput = feed.rss2()
const dateMatch = rssOutput.match(/<pubDate>(.*?)<\/pubDate>/)
if (dateMatch) {
  console.log('RSS 中的日期:', dateMatch[1])
}