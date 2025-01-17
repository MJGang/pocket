import fs from 'fs'

// 定义正则表达式
const OPEN_TAG_REGEX = /\{\{!--\s*(\w+)(.*?)\s*--\}\}/ // 匹配开区间
const CLOSE_TAG_REGEX = /\{\{!--\s*\/(\w+)\s*--\}\}/ // 匹配闭区间
const ATTR_REGEX = /:(\w+)="(.*?)"/g // 匹配属性，value用双引号包裹

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
    let value = match[2] // 属性值

    console.log('解析的value', value, typeof value, value.length)

    // 解析value为合法的JS类型
    try {
      // 如果value是单引号包裹的字符串
      if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1) // 去掉单引号
      }
      // 如果value是布尔值
      else if (value === 'true' || value === 'false') {
        value = value === 'true'
      }
      // 如果value是数字
      else if (!isNaN(Number(value))) {
        value = Number(value)
      }
      // 如果value是对象或数组
      else if (value.startsWith('{') || value.startsWith('[')) {
        value = parseJsObject(value)
      }
    } catch (error) {
      console.error(`Failed to parse value for key "${key}":`, value)
      throw error
    }

    attrs[key] = value
    console.log('解析后value', value)
  }

  if (Object.keys(attrs).length === 0) {
    return
  }
  return attrs
}

// 解析JavaScript对象字符串
function parseJsObject(value) {
  try {
    // 使用 new Function 动态执行字符串
    return new Function(`return ${value}`)()
  } catch (err) {
    console.log(err)
    throw new Error(`Invalid JavaScript object: ${value}`)
  }
}

// 测试
const filePath = './example.txt' // 替换为你的文件路径
try {
  const parsedResult = parseFile(filePath)
  console.log('Parsed Result:', parsedResult)
} catch (error) {
  console.error('Error:', error.message)
}
