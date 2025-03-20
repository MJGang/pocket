import path from 'node:path'
import prompts from 'prompts'
import fs from 'node:fs'
import chalk from 'chalk'
import { PocketLogger } from '../utils/logger.js'
import {
  getUIQuestions,
  getCssQuestions,
  getProjectQuestions,
  getGitWorkflowQuestions,
  getPackageManagerQuestions,
} from '../config/questions.js'
import { packageManagerCommands } from '../config/commands.js'
import { optimizeScaffold } from './scaffold.js'
import { updatePackageJson } from '../utils/dependencies.js'
import hbscmd from 'hbs-commander'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export class Creator {
  constructor(cliOptions = {}) {
    this.cliOptions = cliOptions
  }

  async create() {
    try {
      // 收集用户配置
      this.options = await this.promptQuestions()

      // 创建基础项目
      await this.createBaseProject()

      // 清理和优化
      await this.optimizeProject()

      // 配置开发环境
      await this.setupDevEnvironment()

      // 安装依赖
      // await this.installDependencies()

      // 生成项目配置文件
      await this.generateProjectConfig()

      // 显示完成消息
      this.showCompletionMessage()
    } catch (err) {
      PocketLogger.error(err.message)
      process.exit(1)
    }
  }

  async promptQuestions() {
    // 合并命令行选项和问题答案
    const answers = {
      ...this.cliOptions,
    }

    const questions = []

    // 项目配置
    const projectQuestions = getProjectQuestions(this.cliOptions)
    if (projectQuestions.length > 0) {
      questions.push(...projectQuestions)
    }

    // UI 框架配置
    const uiQuestions = getUIQuestions(this.cliOptions)
    if (uiQuestions.length > 0) {
      questions.push(...uiQuestions)
    }

    // CSS 配置
    const cssQuestions = getCssQuestions(this.cliOptions)
    if (cssQuestions.length > 0) {
      questions.push(...cssQuestions)
    }

    // Git 工作流配置
    const gitWorkflowQuestions = getGitWorkflowQuestions(this.cliOptions)
    if (gitWorkflowQuestions.length > 0) {
      questions.push(...gitWorkflowQuestions)
    }

    // 包管理器配置
    const packageManagerQuestions = getPackageManagerQuestions(this.cliOptions)
    if (packageManagerQuestions.length > 0) {
      questions.push(...packageManagerQuestions)
    }

    const result = await prompts(questions, {
      onCancel: (err) => {
        throw new Error(chalk.red('✖') + ` ${err.message}`)
      },
    })

    Object.assign(answers, result)

    return answers
  }

  async createBaseProject() {
    const { projectName, packageManager } = this.options
    const commands = packageManagerCommands[packageManager]

    const command = [
      `${commands.create} vue@latest`,
      projectName,
      '--jsx',
      '--router',
      '--pinia',
      '--eslint',
      '--eslint-with-prettier',
      '--force',
    ].join(' ')
    PocketLogger.info(`Running 创建项目目录`)
    try {
      await execAsync(command, {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10000,
      })
    } catch (error) {
      throw new Error(`${projectName} 项目创建失败: ${error.message}`)
    }
  }

  async optimizeProject() {
    PocketLogger.info(`Running 优化项目结构`)

    const { projectName } = this.options

    this.projectDir = path.join(process.cwd(), projectName)
    try {
      await optimizeScaffold(this.projectDir)
    } catch (error) {
      throw new Error(`项目结构优化失败: ${error.message}`)
    }
  }

  async setupDevEnvironment() {
    PocketLogger.info(`Running 配置依赖项`)
    const {
      uiFramework, // 'element-plus'
      gitWorkflowTools, // [ 'husky', 'lint-staged', 'commitlint', 'changelog' ]
      cssTool, // 'unocss'
      cssPreprocessor, // 'scss'
    } = this.options

    let tasks = [uiFramework, cssTool, cssPreprocessor]
    if (Array.isArray(gitWorkflowTools) && gitWorkflowTools.length > 0) {
      tasks.push(...gitWorkflowTools)
    }
    /**
     * 确保Git仓库已初始化
     * @param {string} projectDir - 项目目录
     * @returns {Promise<void>}
     */
    async function ensureGitInitialized(projectDir) {
      try {
        await execAsync('git rev-parse --git-dir', { cwd: projectDir })
      } catch {
        try {
          await execAsync('git init', { cwd: projectDir })
        } catch (error) {
          throw new Error(`Git 初始化失败: ${error.message}`)
        }
      }
    }
    tasks = tasks
      .filter((v) => v !== 'none')
      .map((name) => {
        PocketLogger.info(`新增特性 ${name}`)
        const callback = async () => {
          await updatePackageJson(this.projectDir, name)

          if (name === uiFramework) {
            // 修改框架相关文件
            await hbscmd({
              template: path.join(__dirname, `../templates/ui-framework/${name}`),
              target: this.projectDir,
            })
          }

          if (name === cssTool) {
            await hbscmd({
              template: path.join(__dirname, `../templates/css-tools/${name}`),
              target: this.projectDir,
            })
          }

          if (Array.isArray(gitWorkflowTools) && gitWorkflowTools.includes(name)) {
            await ensureGitInitialized(this.projectDir)
            // 统一并行处理所有模板（使用智能定位）
            await hbscmd({
              template: path.join(__dirname, `../templates/git-workflow/${name}`),
              target: this.projectDir,
              deferWrite: true,
            })
            // 手动触发写入
            await hbscmd.applyDeferredWrites()
          }
        }
        return callback
      })

    // 顺序执行所有任务，避免竞态问题
    for (const task of tasks) {
      await task()
    }
  }

  async generateProjectConfig() {
    PocketLogger.info(`Running 生成项目配置文件`)
    const config = {
      name: this.options.projectName,
      version: '0.0.1',
      createTime: new Date().toISOString(),
    }

    const configPath = path.join(this.projectDir, 'pocket.config.js')
    const jsConfig = `export default ${JSON.stringify(config, null, 2)}`

    await fs.promises.writeFile(configPath, jsConfig)
  }

  showCompletionMessage() {
    PocketLogger.success(`✨ 项目 ${this.options.projectName} 创建成功！`)
    PocketLogger.info('👉 接下来你可以:')
    PocketLogger.info(`   cd ${this.options.projectName}`)
    PocketLogger.info(`   ${this.options.packageManager} install`)
    PocketLogger.info(`   ${this.options.packageManager} dev`)
  }

  async installDependencies() {
    // 切到项目目录
    process.chdir(this.projectDir)
    const { start, succeed, fail } = PocketLogger.spinner('正在安装依赖...')
    start()
    const { packageManager } = this.options
    const commands = packageManagerCommands[packageManager]

    try {
      await execAsync(commands.install, {
        stdio: 'inherit',
        cwd: this.projectDir,
      })
      succeed('依赖安装成功')
    } catch (error) {
      fail('依赖安装失败')
      throw new Error(`依赖安装失败: ${error.message}`)
    }
  }
}
