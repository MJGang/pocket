import fs from 'node:fs/promises'
import { execAsync } from '../utils/index.js'
import { getPackageManagerCommands } from '../utils/packageManager.js'
import path from 'node:path'

/**
 * 写入配置文件
 * @param {string} filePath - 文件路径
 * @param {object} config - 配置对象
 * @throws {Error} 写入失败时抛出错误
 */
async function writeConfigFile(filePath, config) {
  try {
    await fs.writeFile(filePath, JSON.stringify(config, null, 2))
    console.log(`配置文件写入成功: ${filePath}`)
  } catch (error) {
    throw new Error(`配置文件写入失败: ${filePath}\n${error.message}`)
  }
}

/**
 * 确保Git仓库已初始化
 * @param {string} projectDir - 项目目录
 * @returns {Promise<void>}
 */
async function ensureGitInitialized(projectDir) {
  try {
    await execAsync('git rev-parse --git-dir', { cwd: projectDir })
    console.log('Git 仓库已存在')
  } catch {
    console.log('正在初始化 Git 仓库...')
    try {
      await execAsync('git init', { cwd: projectDir })
      console.log('Git 仓库初始化成功')
    } catch (error) {
      throw new Error(`Git 初始化失败: ${error.message}`)
    }
  }
}

/**
 * 设置Git工具
 * @param {string} projectDir - 项目目录
 * @param {string[]} tools - 需要安装的工具列表
 * @param {string} packageManager - 包管理器名称
 * @returns {Promise<void>}
 * @throws {Error} 配置失败时抛出错误
 */
export async function setupGitTools(projectDir, tools, packageManager) {
  if (!Array.isArray(tools) || tools.length === 0) {
    throw new Error('无效的工具配置')
  }

  try {
    const commands = getPackageManagerCommands(packageManager)
    if (!commands) {
      throw new Error('不支持的包管理器')
    }

    // 确保git已初始化
    await ensureGitInitialized(projectDir)

    if (tools.includes('husky')) {
      console.log('正在配置 husky...')
      await execAsync(`${commands.add} -D husky`, {
        stdio: 'inherit',
        cwd: projectDir,
      })
      await execAsync(`npx husky install`, {
        stdio: 'inherit',
        cwd: projectDir,
      })

      // 添加pre-commit hook
      const preCommitHook = path.join(projectDir, '.husky', 'pre-commit')
      await fs.mkdir(path.dirname(preCommitHook), { recursive: true })
      const preCommitContent = await fs.readFile(
        path.join(__dirname, '../templates/husky/pre-commit.hbs'),
        'utf-8',
      )
      await fs.writeFile(preCommitHook, preCommitContent, { mode: 0o755 })
    }

    if (tools.includes('lint-staged')) {
      console.log('正在配置 lint-staged...')
      await execAsync(`${commands.add} -D lint-staged`, {
        stdio: 'inherit',
        cwd: projectDir,
      })

      const lintStagedConfig = {
        '*.{js,jsx,ts,tsx}': ['eslint --fix', 'git add'],
        '*.{css,scss}': ['stylelint --fix', 'git add'],
        '*.{json,md}': ['prettier --write', 'git add'],
      }

      const packageJsonPath = path.join(projectDir, 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      packageJson['lint-staged'] = lintStagedConfig
      await writeConfigFile(packageJsonPath, packageJson)
    }

    if (tools.includes('commitlint')) {
      console.log('正在配置 commitlint...')
      await execAsync(`${commands.add} -D @commitlint/{config-conventional,cli}`, {
        stdio: 'inherit',
        cwd: projectDir,
      })

      const commitlintConfig = {
        extends: ['@commitlint/config-conventional'],
        rules: {
          'type-enum': [
            2,
            'always',
            ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'revert'],
          ],
        },
      }
      await writeConfigFile(
        path.join(projectDir, 'commitlint.config.js'),
        `module.exports = ${JSON.stringify(commitlintConfig, null, 2)}`,
      )

      // 添加commit-msg hook
      if (tools.includes('husky')) {
        const commitMsgHook = path.join(projectDir, '.husky', 'commit-msg')
        const commitMsgContent = await fs.readFile(
          path.join(__dirname, '../templates/husky/commit-msg.hbs'),
          'utf-8',
        )
        await fs.writeFile(commitMsgHook, commitMsgContent, { mode: 0o755 })
      }
    }

    if (tools.includes('changelog')) {
      console.log('正在配置 conventional-changelog...')
      await execAsync(`${commands.add} -D conventional-changelog-cli`, {
        stdio: 'inherit',
        cwd: projectDir,
      })

      // 添加changelog生成脚本
      const packageJsonPath = path.join(projectDir, 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      packageJson.scripts = packageJson.scripts || {}
      packageJson.scripts['changelog'] = 'conventional-changelog -p angular -i CHANGELOG.md -s'
      await writeConfigFile(packageJsonPath, packageJson)
    }

    console.log('Git 工具配置完成')
  } catch (error) {
    throw new Error('配置 Git 工具时出错：', error)
  }
}
