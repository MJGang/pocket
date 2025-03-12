import path from 'node:path'
import prompts from 'prompts'
import fs from 'node:fs'
import chalk from 'chalk'
import ora from 'ora'
import { MultiBar } from 'cli-progress'
import { execAsync } from '../utils/index.js'
import {
  getUIQuestions,
  getCssQuestions,
  getProjectQuestions,
  getGitWorkflowQuestions,
  getPackageManagerQuestions,
} from '../config/questions.js'
import { packageManagerCommands } from '../config/commands.js'
import { optimizeScaffold } from './scaffold.js'
import { setupUIFramework } from '../handlers/ui.js'
import { setupCSSTools } from '../handlers/css.js'
import { setupGitTools } from '../handlers/git.js'
import { console } from 'node:inspector'

const { cyan, red, yellow, green } = chalk

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
      console.log(err.message)
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
        throw new Error(red('✖') + ` ${err.message}`)
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
    const spinner = ora(`正在创建 ${projectName} 项目...`).start()
    try {
      await execAsync(command, {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10000,
      })
      spinner.succeed(`${projectName} 项目创建成功`)
    } catch (error) {
      spinner.fail(`创建 ${projectName} 项目失败`)
      throw new Error(`创建 ${projectName} 项目失败: ${error.message}`)
    }
  }

  async optimizeProject() {
    const { projectName } = this.options
    const spinner = ora(`正在优化 ${projectName} 项目结构 ...`).start()
    this.projectDir = path.join(process.cwd(), this.options.projectName)
    try {
      await optimizeScaffold(this.projectDir)
      spinner.succeed(`${projectName} 项目结构优化成功`)
    } catch (error) {
      spinner.fail(`${projectName} 项目结构优化失败 ${error}`)
      throw new Error(`${projectName} 项目结构优化失败: ${error.message}`)
    }
  }

  async setupDevEnvironment() {
    console.log(this.options)
    const {
      projectName,
      packageManager,
      uiFramework, // 'element-plus'
      gitWorkflowTools, // [ 'husky', 'lint-staged', 'commitlint', 'changelog' ]
      cssTool, // 'unocss'
      cssPreprocessor, // 'scss'
    } = this.options

    const tasks = []
    const progress = {
      ui: { title: `加载 ${uiFramework} 框架`, status: 'pending', progress: 0 },
      css: { title: `加载 ${cssPreprocessor} 和 ${cssTool}`, status: 'pending', progress: 0 },
      git: { title: '配置 Git 工作流工具', status: 'pending', progress: 0 },
    }

    const bars = new MultiBar({
      format: '{title} [{bar}] {percentage}%',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      barGlue: ' ',
      align: 'left',
    })

    const progressBars = {}
    const totalTasks = Object.keys(progress).length

    // 初始化进度条
    Object.entries(progress).forEach(([key, { title }], index) => {
      progressBars[key] = bars.create(100, 0, { title: `[${index + 1}/${totalTasks}] ${title}` })
    })

    const updateProgress = (type, status) => {
      const bar = progressBars[type]
      if (!bar) return

      bar.update(
        status === 'success'
          ? 100
          : status === 'failed'
            ? 0
            : typeof status === 'number'
              ? Math.floor(status * 100)
              : 30,
      )
    }

    if (uiFramework !== 'none') {
      tasks.push(
        setupUIFramework(this.projectDir, uiFramework, (progress) => updateProgress('ui', progress))
          .then(() => updateProgress('ui', 'success'))
          .catch((err) => {
            updateProgress('ui', 'failed')
            throw err
          }),
      )
      updateProgress('ui', 'pending')
    }

    if (cssTool !== 'none') {
      tasks.push(
        setupCSSTools(this.projectDir, cssPreprocessor, cssTool, (progress) =>
          updateProgress('css', progress),
        )
          .then(() => updateProgress('css', 'success'))
          .catch((err) => {
            updateProgress('css', 'failed')
            throw err
          }),
      )
      updateProgress('css', 'pending')
    }

    if (gitWorkflowTools?.length > 0) {
      tasks.push(
        setupGitTools(this.projectDir, gitWorkflowTools, (progress) =>
          updateProgress('git', progress),
        )
          .then(() => updateProgress('git', 'success'))
          .catch((err) => {
            updateProgress('git', 'failed')
            throw err
          }),
      )
      updateProgress('git', 'pending')
    }

    try {
      await Promise.all(tasks)
      bars.stop()
    } catch (error) {
      bars.stop()
      throw new Error(`开发环境配置失败: ${error.message}`)
    }
  }

  async generateProjectConfig() {
    const config = {
      name: this.options.projectName,
      version: '0.0.1',
      createTime: new Date().toISOString(),
    }

    const jsConfig = `export default ${JSON.stringify(config, null, 2)}`
    await fs.promises.writeFile(path.join(this.projectDir, 'pocket.config.js'), jsConfig)
  }

  showCompletionMessage() {
    console.log(green(`\n✨ 项目 ${this.options.projectName} 创建成功！\n`))
    console.log('👉 接下来你可以：\n')
    console.log(cyan(`  cd ${this.options.projectName}`))
    console.log(cyan(`  ${this.options.packageManager} dev`))
    console.log()
  }

  async installDependencies() {
    console.log(yellow('正在安装依赖...'))
    const { packageManager } = this.options
    const commands = packageManagerCommands[packageManager]

    try {
      execAsync(commands.install, {
        stdio: 'inherit',
        cwd: this.projectDir,
      })
    } catch (error) {
      console.error(red('依赖安装失败:'), error)
      throw error
    }
  }
}
