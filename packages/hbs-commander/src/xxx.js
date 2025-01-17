import fs from 'fs'

// 定义正则表达式
const OPEN_TAG_REGEX = /\{\{!--\s*(\w+)(.*?)\s*--\}\}/ // 匹配开区间
const CLOSE_TAG_REGEX = /\{\{!--\s*\/(\w+)\s*--\}\}/ // 匹配闭区间
const ATTR_REGEX = /:(\w+)=["']([^"']*)["']/g // 匹配属性

// 解析文件内容
function parseFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const stack = [] // 用于跟踪标签的嵌套关系
  const result = [] // 存储解析结果

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // 匹配开区间
    const openMatch = line.match(OPEN_TAG_REGEX)
    if (openMatch) {
      const tagName = openMatch[1] // 提取标签名
      const attrsStr = openMatch[2] // 提取属性字符串
      const attrs = parseAttributes(attrsStr) // 解析属性

      // 将开区间信息压入栈
      stack.push({ tag: tagName, attrs, startLine: i + 1 })
      result.push({ type: 'open', tag: tagName, attrs, line: i + 1 })
      continue
    }

    // 匹配闭区间
    const closeMatch = line.match(CLOSE_TAG_REGEX)
    if (closeMatch) {
      const tagName = closeMatch[1] // 提取标签名

      // 检查栈顶的标签是否匹配
      if (stack.length === 0 || stack[stack.length - 1].tag !== tagName) {
        throw new Error(`Invalid closing tag: ${tagName} at line ${i + 1}`)
      }

      // 弹出栈顶的标签
      const openTag = stack.pop()
      result.push({ type: 'close', tag: tagName, line: i + 1 })

      // 输出标签的内容范围
      console.log(`Tag "${tagName}" spans from line ${openTag.startLine} to line ${i + 1}`)
      continue
    }
  }

  // 检查栈是否为空（确保所有标签都正确闭合）
  if (stack.length > 0) {
    throw new Error(`Unclosed tag: ${stack[stack.length - 1].tag}`)
  }

  return result
}

// 解析属性字符串
function parseAttributes(attrsStr) {
  const attrs = {}
  let match
  while ((match = ATTR_REGEX.exec(attrsStr)) !== null) {
    const key = match[1] // 属性名
    const value = match[2] // 属性值
    attrs[key] = value
  }
  return attrs
}

// 测试
const filePath = './example.txt' // 替换为你的文件路径
try {
  const parsedResult = parseFile(filePath)
  console.log('Parsed Result:', parsedResult)
} catch (error) {
  console.error('Error:', error.message)
}
