import fsPromise from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'
import { renderTemplate } from '../utils/index.js'

export async function cleanupScaffold(projectDir) {
  // 清理脚手架逻辑
  const filesToRemove = [
    path.join(projectDir, 'src', 'components', 'HelloWorld.vue'),
    path.join(projectDir, 'src', 'components', 'TheWelcome.vue'),
    path.join(projectDir, 'src', 'components', 'WelcomeItem.vue'),
    path.join(projectDir, 'src', 'assets', 'base.css'),
    path.join(projectDir, 'src', 'assets', 'logo.svg'),
    path.join(projectDir, 'src', 'assets', 'main.css'),
    path.join(projectDir, 'src', 'views', 'AboutView.vue'),
    path.join(projectDir, 'src', 'views', 'HomeView.vue'),
    path.join(projectDir, 'src', 'stores', 'counter.js'),
    path.join(projectDir, 'src', 'router', 'index.js'),
  ]

  // 批量删除文件
  await Promise.all(
    filesToRemove.map(async (file) => {
      try {
        if (fs.existsSync(file)) {
          await fsPromise.unlink(file)
        }
      } catch (error) {
        console.error(`Failed to remove file: ${file}`, error)
      }
    }),
  )

  // 删除不需要的目录
  const dirsToRemove = [
    path.join(projectDir, 'src', 'components', 'icons'),
    path.join(projectDir, 'src', 'views'),
  ]

  await Promise.all(
    dirsToRemove.map(async (dir) => {
      try {
        if (fs.existsSync(dir)) {
          await fsPromise.rm(dir, { recursive: true, force: true })
        }
      } catch (error) {
        console.error(`Failed to remove directory: ${dir}`, error)
      }
    }),
  )

  // 使用模板清理 App.vue
  const appVuePath = path.join(projectDir, 'src', 'App.vue')
  if (fs.existsSync(appVuePath)) {
    await renderTemplate('app.vue.hbs', {}, appVuePath)
  }

  // 清理 main.js
  const mainJsPath = path.join(projectDir, 'src', 'main.js')
  if (fs.existsSync(mainJsPath)) {
    await renderTemplate('main.js.hbs', {}, mainJsPath)
  }

  // 初始化项目结构
  await initProjectStructure(projectDir)
}

async function initProjectStructure(projectDir) {
  // 创建pages目录
  const pagesDir = path.join(projectDir, 'src', 'pages')
  if (!fs.existsSync(pagesDir)) {
    await fsPromise.mkdir(pagesDir, { recursive: true })
  }

  // 创建constants目录
  const constantsDir = path.join(projectDir, 'src', 'constants')
  if (!fs.existsSync(constantsDir)) {
    await fsPromise.mkdir(constantsDir, { recursive: true })
    // 创建基础常量文件
    await renderTemplate('constants/index.js.hbs', {}, path.join(constantsDir, 'index.js'))
  }

  // 创建utils目录
  const utilsDir = path.join(projectDir, 'src', 'utils')
  if (!fs.existsSync(utilsDir)) {
    await fsPromise.mkdir(utilsDir, { recursive: true })
    // 创建基础工具文件
    await renderTemplate('utils/index.js.hbs', {}, path.join(utilsDir, 'index.js'))
  }

  // 确保assets目录存在并创建空的style.css文件
  const assetsDir = path.join(projectDir, 'src', 'assets')
  if (!fs.existsSync(assetsDir)) {
    await fsPromise.mkdir(assetsDir, { recursive: true })
  }
  const styleCssPath = path.join(assetsDir, 'style.css')
  if (!fs.existsSync(styleCssPath)) {
    await fsPromise.writeFile(styleCssPath, '')
  }
}
