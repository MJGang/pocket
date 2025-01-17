import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import Handlebars from 'handlebars'
import deepMerge from './deepMerge'
import sortDependencies from './sortDependencies'

export const execAsync = promisify(exec)

const templateRoot = path.resolve(__dirname, '../templates')

/**
 * 渲染模板文件夹/文件到文件系统
 * @param {string} src 源文件路径
 * @param {string} dest 目标文件路径
 * @param {Array<Function>} callbacks 回调函数数组
 */
export function renderTemplate(src, dest, callbacks = []) {
  const stats = fs.statSync(src)

  if (stats.isDirectory()) {
    // 跳过node_modules
    if (path.basename(src) === 'node_modules') {
      return
    }

    // 如果是目录，递归处理子目录和文件
    fs.mkdirSync(dest, { recursive: true })
    for (const file of fs.readdirSync(src)) {
      renderTemplate(path.resolve(src, file), path.resolve(dest, file), callbacks)
    }
    return
  }

  const filename = path.basename(src)

  // 处理package.json合并
  if (filename === 'package.json' && fs.existsSync(dest)) {
    const existing = JSON.parse(fs.readFileSync(dest, 'utf8'))
    const newPackage = JSON.parse(fs.readFileSync(src, 'utf8'))
    const pkg = sortDependencies(deepMerge(existing, newPackage))
    fs.writeFileSync(dest, JSON.stringify(pkg, null, 2) + '\n')
    return
  }

  if (filename === 'extensions.json' && fs.existsSync(dest)) {
    // merge instead of overwriting
    const existing = JSON.parse(fs.readFileSync(dest, 'utf8'))
    const newExtensions = JSON.parse(fs.readFileSync(src, 'utf8'))
    const extensions = deepMerge(existing, newExtensions)
    fs.writeFileSync(dest, JSON.stringify(extensions, null, 2) + '\n')
    return
  }

  if (filename === 'settings.json' && fs.existsSync(dest)) {
    // merge instead of overwriting
    const existing = JSON.parse(fs.readFileSync(dest, 'utf8'))
    const newSettings = JSON.parse(fs.readFileSync(src, 'utf8'))
    const settings = deepMerge(existing, newSettings)
    fs.writeFileSync(dest, JSON.stringify(settings, null, 2) + '\n')
    return
  }

  // 处理以_开头的文件
  if (filename.startsWith('_')) {
    // 将`_file`重命名为`.file`
    dest = path.resolve(path.dirname(dest), filename.replace(/^_/, '.'))
  }

  // 处理Handlebars模板文件
  if (filename.endsWith('.hbs')) {
    const templateContent = fs.readFileSync(src, 'utf-8')
    const template = Handlebars.compile(templateContent)
    const result = template({})
    fs.writeFileSync(dest.replace(/\.hbs$/, ''), result)
    return
  }

  // 默认情况直接复制文件
  fs.copyFileSync(src, dest)
}

/**
 * 创建模板渲染器
 * @param {string} root 项目根目录
 * @returns {Object} 包含render方法的对象
 */
export function createTemplateRenderer(root) {
  const callbacks = []

  return {
    /**
     * 渲染指定模板
     * @param {string} templateName 模板名称
     */
    render(templateName) {
      const templateDir = path.resolve(templateRoot, templateName)
      renderTemplate(templateDir, root, callbacks)
    },

    /**
     * 执行所有回调
     * @returns {Promise<void>}
     */
    async executeCallbacks() {
      const dataStore = {}
      for (const callback of callbacks) {
        await callback(dataStore)
      }
    },
  }
}
