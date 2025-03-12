import fs from 'node:fs/promises'
import { execAsync } from '../utils/index.js'
import { getPackageManagerCommands } from '../utils/packageManager.js'
import path from 'node:path'
import hbscmd from 'hbs-commander'
import { getPackageVersions, updatePackageDependencies } from '../utils/dependencies.js'

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

// Git工具包配置
const GIT_TOOL_PACKAGES = {
  husky: {
    dev: ['husky'],
  },
  'lint-staged': {
    dev: ['lint-staged'],
  },
  commitlint: {
    dev: ['@commitlint/cli', '@commitlint/config-conventional'],
  },
  changelog: {
    dev: ['conventional-changelog-cli'],
  },
}

/**
 * 设置Git工具
 * @param {string} projectDir - 项目目录
 * @param {string[]} gitWorkflowTools - 需要安装的工具列表
 * @param {function} onProgress - 进度回调函数
 * @returns {Promise<void>}
 * @throws {Error} 配置失败时抛出错误
 */
export async function setupGitTools(projectDir, gitWorkflowTools, onProgress) {
  const progressSteps = {
    init: 0.3,
    depsInstalled: 0.6,
    templatesRendered: 1,
  }

  try {
    await ensureGitInitialized(projectDir)
    if (onProgress) onProgress(progressSteps.init)

    // 收集所有开发依赖
    const allDevDeps = gitWorkflowTools.reduce((acc, tool) => {
      const { dev = [] } = GIT_TOOL_PACKAGES[tool] || {}
      return [...acc, ...dev]
    }, [])

    // 批量安装开发依赖
    if (allDevDeps.length > 0) {
      const versions = await getPackageVersions(allDevDeps)
      await updatePackageDependencies(projectDir, versions, true)
    }
    if (onProgress) onProgress(progressSteps.depsInstalled)

    // 统一并行处理所有模板（使用智能定位）
    await Promise.all(
      gitWorkflowTools.map((tool) =>
        hbscmd({
          template: path.join(__dirname, `../templates/git-workflow/${tool}`),
          target: projectDir,
        }),
      ),
    )

    if (onProgress) onProgress(progressSteps.templatesRendered)

    console.log('Git 工具配置完成')
  } catch (error) {
    if (onProgress) onProgress('failed')
    throw new Error(`Git 工具配置失败: ${error.message}`)
  }
}
