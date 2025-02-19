import fsPromise from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'
import hbscmd from 'hbs-commander'

export async function optimizeScaffold(projectDir) {
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
      if (fs.existsSync(file)) {
        await fsPromise.unlink(file)
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
      if (fs.existsSync(dir)) {
        await fsPromise.rm(dir, { recursive: true, force: true })
      }
    }),
  )

  // 新增模板渲染逻辑
  await hbscmd({
    template: path.join(__dirname, '../templates/base'),
    target: projectDir,
  })
}
