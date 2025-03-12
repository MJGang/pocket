import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import colors from 'picocolors'
import { defaults } from './defaults.js'
import { isValidProjectName } from '../utils/validate.js'
import { packageManagerList } from './commands.js'

function isNrmInstalled() {
  try {
    execSync('nrm --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const { red, blue } = colors

// 项目配置
export function getProjectQuestions({ projectName }) {
  const questions = []

  // 如果命令行没有指定项目名，才询问
  if (!projectName) {
    questions.push({
      type: 'text',
      name: 'projectName',
      message: blue('请输入项目名称:'),
      initial: defaults.projectName,
      validate: (input) => {
        if (!input.trim()) {
          return '项目名称不能为空'
        }
        if (!isValidProjectName(input)) {
          return '项目名称只能包含字母、数字、下划线和连字符'
        }
        return true
      },
    })
  }

  // 检查项目目录是否存在
  questions.push({
    type: (prev, values) => {
      const _projectName = values.projectName || projectName
      const targetDir = path.join(process.cwd(), _projectName)
      return fs.existsSync(targetDir) ? 'toggle' : null
    },
    name: 'overwrite',
    message: (_, values) => {
      const _projectName = values.projectName || projectName
      return red(`目录 ${_projectName} 已存在。是否覆盖?`)
    },
    initial: true,
    active: '是',
    inactive: '否',
  })

  return questions
}

// UI 框架配置
export function getUIQuestions({ uiFramework }) {
  const questions = []

  if (!uiFramework) {
    questions.push({
      type: 'select',
      name: 'uiFramework',
      message: blue('选择 UI 框架:'),
      choices: [
        { title: 'Element Plus', value: 'element-plus' },
        { title: 'Ant Design Vue', value: 'ant-design-vue' },
      ],
    })
  }

  return questions
}

// CSS 配置
export function getCssQuestions({ cssPreprocessor, cssTool }) {
  const questions = []

  if (!cssPreprocessor) {
    questions.push({
      type: 'select',
      name: 'cssPreprocessor',
      message: blue('选择 CSS 预处理器:'),
      choices: [
        { title: 'Scss', value: 'scss' },
        { title: 'Less', value: 'less' },
        { title: 'None', value: 'none' },
      ],
    })
  }

  if (!cssTool) {
    questions.push({
      type: 'select',
      name: 'cssTool',
      message: blue('选择 CSS 工具:'),
      choices: [
        { title: 'UnoCSS', value: 'unocss' },
        { title: 'TailwindCSS', value: 'tailwindcss' },
        { title: 'None', value: 'none' },
      ],
    })
  }

  return questions
}

// Git 工作流配置
export function getGitWorkflowQuestions({ gitWorkflowTools }) {
  const questions = []

  if (!gitWorkflowTools) {
    questions.push(
      {
        type: 'confirm',
        name: 'wantGitWorkflowTools',
        message: blue('是否需要 Git 工作流配置?'),
        initial: true,
      },
      {
        type: (prev) => (prev ? 'multiselect' : null),
        name: 'gitWorkflowTools',
        message: blue('选择需要的 Git 工作流工具:'),
        choices: [
          { title: 'Husky (Git Hooks)', value: 'husky' },
          { title: 'Lint Staged', value: 'lint-staged' },
          { title: 'Commitlint', value: 'commitlint' },
          { title: 'Changelog', value: 'changelog' },
        ],
      },
    )
  }

  return questions
}

// 包管理器配置
export function getPackageManagerQuestions({ packageManager }) {
  const questions = []

  // 如果命令行没有指定包管理器，才询问
  if (!packageManager) {
    questions.push({
      type: 'select',
      name: 'packageManager',
      message: blue('选择包管理器:'),
      choices: packageManagerList,
    })
  }

  // 检查nrm是否安装
  if (!isNrmInstalled()) {
    questions.push({
      type: 'confirm',
      name: 'wantInstallNrm',
      message: blue('检测到未安装nrm，是否要安装?'),
      initial: true,
    })
  }

  return questions
}
