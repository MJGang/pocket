import * as path from 'node:path'
import { parse } from '@babel/parser'
import { parse as vueParse } from '@vue/compiler-sfc'
import { builtInRules } from './insertionRules'

export default class InsertionPlugin {
  constructor() {
    this.rules = []
  }

  apply(content, filePath) {
    const fileType = this.getFileType(filePath)
    if (!fileType) return content

    const ast = this.parseFile(content, fileType)
    if (!ast) return content

    this.rules.forEach((rule) => {
      if (rule.fileType === fileType) {
        content = this.insertContent(content, ast, rule)
      }
    })

    return content
  }

  addRule(rule) {
    this.rules.push(rule)
  }

  getFileType(filePath) {
    const ext = path.extname(filePath)
    switch (ext) {
      case '.js':
        return 'js'
      case '.vue':
        return 'vue'
      case '.css':
        return 'css'
      default:
        return null
    }
  }

  parseFile(content, fileType) {
    try {
      if (fileType === 'js') {
        return parse(content, {
          sourceType: 'module',
          plugins: ['jsx'],
        })
      }
      if (fileType === 'vue') {
        return vueParse(content).descriptor
      }
      return null
    } catch (error) {
      console.error('Parse error:', error)
      return null
    }
  }

  insertContent(content, ast, rule) {
    if (!ast || !rule) return content

    const fileType = this.getFileType(rule.filePath)
    const builtInRule = builtInRules[fileType]?.[rule.position]

    if (builtInRule) {
      return builtInRule.insert(ast, content, rule.content)
    }

    return content
  }
}
