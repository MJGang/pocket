import { execAsync } from '../utils/index.js'
import { getPackageManagerCommands } from '../utils/packageManager.js'
import { renderTemplate } from '../utils/index.js'
import fs from 'node:fs'
import path from 'node:path'

export async function setupCSSTools(projectDir, preprocessor, tools, packageManager) {
  const commands = getPackageManagerCommands(packageManager)

  // 安装 CSS 预处理器
  if (preprocessor !== 'none') {
    await execAsync(`${commands.add} -D ${preprocessor}`, {
      stdio: 'inherit',
      cwd: projectDir,
    })
  }

  // 安装并配置 CSS 工具
  if (tools.includes('unocss')) {
    await execAsync(`${commands.add} -D unocss`, {
      stdio: 'inherit',
      cwd: projectDir,
    })

    // 使用模板生成unocss配置文件
    await renderTemplate('uno.config.js.hbs', {}, path.join(projectDir, 'uno.config.js'))

    // 安装unocss presets
    await execAsync(
      `${commands.add} -D @unocss/preset-uno @unocss/preset-attributify @unocss/preset-icons`,
      {
        stdio: 'inherit',
        cwd: projectDir,
      },
    )
  }

  if (tools.includes('tailwindcss')) {
    await execAsync(`${commands.add} -D tailwindcss postcss autoprefixer`, {
      stdio: 'inherit',
      cwd: projectDir,
    })

    // 生成 tailwind 配置文件
    await execAsync('npx tailwindcss init', {
      stdio: 'inherit',
      cwd: projectDir,
    })

    // 使用模板生成tailwind配置文件
    await renderTemplate('tailwind.config.js.hbs', {}, path.join(projectDir, 'tailwind.config.js'))

    // 使用模板生成tailwind样式文件
    const assetsDir = path.join(projectDir, 'src', 'assets')
    await fs.promises.mkdir(assetsDir, { recursive: true })

    await renderTemplate('style.css.hbs', {}, path.join(assetsDir, 'style.css'))

    // 更新main.js引入样式
    const mainJsPath = path.join(projectDir, 'src', 'main.js')
    let mainJsContent = await fs.promises.readFile(mainJsPath, 'utf-8')
    mainJsContent = mainJsContent.replace(
      /import router from ['"]\.\/router['"]/,
      `import router from './router'\nimport './assets/style.css'`,
    )
    await fs.promises.writeFile(mainJsPath, mainJsContent)
  }
}
