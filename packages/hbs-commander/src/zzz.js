import fs from 'fs'

// 定义状态机的状态
const State = {
  TEXT: 'TEXT', // 普通文本
  OPEN_TAG_START: 'OPEN_TAG_START', // 检测到 {{
  OPEN_TAG: 'OPEN_TAG', // 正在解析开区间
  CLOSE_TAG_START: 'CLOSE_TAG_START', // 检测到 {{
  CLOSE_TAG: 'CLOSE_TAG', // 正在解析闭区间
}

// 解析文件内容
function parseFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const result = [] // 存储解析结果
  const stack = [] // 用于跟踪标签的嵌套关系

  let state = State.TEXT // 初始状态
  let buffer = '' // 当前解析的缓冲区
  let currentTag = null // 当前解析的标签

  for (let i = 0; i < content.length; i++) {
    const char = content[i]

    switch (state) {
      case State.TEXT:
        if (char === '{' && content[i + 1] === '{') {
          // 检测到开区间或闭区间的开始
          buffer = ''
          i++ // 跳过第二个 {
          if (
            content[i + 1] === '!' &&
            content[i + 2] === '-' &&
            content[i + 3] === '-' &&
            content[i + 4] === ' ' &&
            content[i + 5] === '/'
          ) {
            // 检测到闭区间的开始 {{!-- /
            i += 5 // 跳过 !-- /
            state = State.CLOSE_TAG_START
          } else if (
            content[i + 1] === '!' &&
            content[i + 2] === '-' &&
            content[i + 3] === '-' &&
            content[i + 4] === ' '
          ) {
            // 检测到开区间的开始 {{!--
            i += 4 // 跳过 !--
            state = State.OPEN_TAG_START
          }
        } else {
          // 普通文本
          buffer += char
        }
        break

      case State.OPEN_TAG_START:
        if (char === '-' && content[i + 1] === '-') {
          // 检测到开区间的开始 {!--
          i++ // 跳过第二个 -
          state = State.OPEN_TAG
          buffer = ''
        }
        break

      case State.OPEN_TAG:
        if (char === '-' && content[i + 1] === '-' && content[i + 2] === '}') {
          // 检测到开区间的结束 --}}
          i += 2 // 跳过 --}
          const tagMatch = buffer.match(/^\s*(\w+)(.*?)\s*$/)
          if (tagMatch) {
            const tagName = tagMatch[1] // 标签名
            const attrsStr = tagMatch[2] // 属性字符串
            currentTag = { tag: tagName, attrs: parseAttributes(attrsStr) }
            stack.push(currentTag)
            result.push({ type: 'open', ...currentTag })
          }
          state = State.TEXT
        } else {
          buffer += char
        }
        break

      case State.CLOSE_TAG_START:
        if (char === '-' && content[i + 1] === '-') {
          // 检测到闭区间的开始 {!--
          i++ // 跳过第二个 -
          state = State.CLOSE_TAG
          buffer = ''
        }
        break

      case State.CLOSE_TAG:
        if (char === '-' && content[i + 1] === '-' && content[i + 2] === '}') {
          // 检测到闭区间的结束 --}}
          i += 2 // 跳过 --}
          const tagMatch = buffer.match(/^\s*\/(\w+)\s*$/)
          if (tagMatch) {
            const tagName = tagMatch[1] // 标签名
            if (stack.length === 0 || stack[stack.length - 1].tag !== tagName) {
              throw new Error(`Invalid closing tag: ${tagName}`)
            }
            stack.pop()
            result.push({ type: 'close', tag: tagName })
          }
          state = State.TEXT
        } else {
          buffer += char
        }
        break
    }
  }

  // 检查栈是否为空（确保所有标签都正确闭合）
  if (stack.length > 0) {
    console.log(stack)
    throw new Error(`Unclosed tag: ${stack[stack.length - 1].tag}`)
  }

  return result
}

// 解析属性字符串
function parseAttributes(attrsStr) {
  const attrs = {}
  const regex = /:(\w+)="([^"]*)"/g // 匹配属性，value用双引号包裹
  let match
  while ((match = regex.exec(attrsStr)) !== null) {
    const key = match[1] // 属性名
    let value = match[2] // 属性值

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
  }
  return attrs
}

// 解析JavaScript对象字符串
function parseJsObject(value) {
  try {
    // 使用 new Function 动态执行字符串
    return new Function(`return ${value}`)()
  } catch (error) {
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
