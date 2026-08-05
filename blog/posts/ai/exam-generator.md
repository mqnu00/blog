---
title: 'ai-coding:文档转换试卷系统'
date: '2026-08-05 14:33'
author: 广习习
tags:
  - deepseek
discussion:
  id: D_kwDOQdT3Qc4AoRG-
  number: 111
  title: 'ai-coding:文档转换试卷系统'
  url: 'https://github.com/mqnu00/blog/discussions/111'
  createdAt: '2026-08-05T07:21:39Z'
url: 'https://mqnu00.github.io/blog/posts/ai/exam-generator.html'
---

# 背景

最近有考试，给了考试的题目，存在word文档里，要练习。

但是直接看文档，没有写题的感觉。

想着说能不能写一个word转json，提取出所有考题，然后加上一个在线的考试系统。

考试系统还是很简单的，难点在word转json方面，word内容，考卷题目的格式不一定，只能通过AI读取转换，就是在这里遇到了难点。

# 解决方法

## 提示词 + 整个文档转换

整个文档直接上传，大概有34万token。

提示词如下：
```
你是一个专业的考试题目提取助手。请从提供的文本中提取所有考试题目，严格返回JSON数组格式。

对于每道题目，识别题型并返回以下结构：
{
  "type": "题目类型: single_choice(单选题) | multiple_choice(多选题) | true_false(判断题) | fill_blank(填空题) | short_answer(简答题)",
  "content": "题目内容",
  "options": ["选项A", "选项B", ...],
  "answer": "正确答案",
  "difficulty": "难度: easy | medium | hard",
  "tags": ["相关标签"]
}

规则：
1. 只返回JSON数组，不要包含任何其他文字或markdown标记
2. 单选题answer为单个选项字母如"A"，多选题answer为字母数组如["A","C"]
3. 判断题answer为"对"或"错"
4. 如果文本中没有题目，返回空数组[]`,
```

效果不太好，我一开始大概是截取了 3000tokens 的试题做了测试，运行没有问题，返回的json也正常。

但是直接把整个文档发送过去，就出现了几个缺点：

1. 运行速度慢，需要等待很久，调试困难
2. 提示词被弱化
3. 直接返回文字/返回过长被截断导致json识别错误

## 提示词 + tools

使用分批(2000~3000tokens一批) 提取，分批返回识别结果。

这里可能有疑问万一把题目切成两半？可以注意到这个分批不是程序切分后分批，而是靠模型调用tool切分读取自己想读的地方。

这个方法就好很多了，用户可以看到多轮对话的进度（看到第几轮对话），等待就不会太焦虑，提取结果是每批返回的也能看到进度。

### 提示词

```js
const systemPrompt = `你是一个专业的考试题目提取助手。你需要从文档中提取所有考试题目。

文档总长度：${documentText.length} 字符。

使用 read_file 工具分段读取文档（每次建议读 2000-3000 字符），边读边识别题目。
识别出题目后，立即使用 task_finish 提交（可分批，每批不超过20道）。
全部处理完毕后，最后一批设置 done: true。

题目格式要求：
- type: single_choice / multiple_choice / true_false / fill_blank / short_answer
- content: 纯题干，不含选项
- options: 选项数组，非选择题为空数组 []
- answer: 单选为"A"，多选为["A","C"]（JSON数组字符串），判断为"对"/"错"
- difficulty: easy / medium / hard
- tags: 相关标签数组

重要：
- 仔细阅读每一段文档，不要遗漏任何题目
- 保持题目原文的准确性
- 如果文档中没有题目，立即 task_finish 提交空数组，done: true`
```

### tools

下面定义了两个tool，考试系统运行的时候，前端解析完上传的文件，触发模型API，当模型返回调用tools的命令，前端就会去执行对应的函数

```js
const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'read_file',
      description:
        '读取待解析文档的指定区间。start 从 0 开始（含），limit 为读取的字符数。每次不要读取超过 3000 字符。',
      parameters: {
        type: 'object' as const,
        properties: {
          start: { type: 'integer' as const, description: '起始字符位置（从0开始）' },
          limit: { type: 'integer' as const, description: '读取的字符数，建议不超过3000' },
        },
        required: ['start', 'limit'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'task_finish',
      description:
        '提交提取到的题目。如果题目较多可分批提交，每批不超过20道。最后一批请设置 done: true。文档中没有题目时，提交空数组并设置 done: true。',
      parameters: {
        type: 'object' as const,
        properties: {
          questions: {},    // 题目类型
          done: { type: 'boolean' as const, description: '是否为最后一批（true=任务完成）' },
        },
        required: ['questions', 'done'],
      },
    },
  },
]
```

# 总结

整体的优化方法就是提供给模型一个窗口，让模型自由的扫描这个文档。

但必须承认这个方法很依赖模型的能力，如果模型检测不出来题目被切断，不会自动扩大缩小扫描窗口，这个方法也是捉瞎。
