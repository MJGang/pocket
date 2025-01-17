import { parseArgs } from 'node:util'
import chalk from 'chalk'
import { showWelcomeBanner } from './utils/banners.js'
import { validateOptions } from './utils/validate.js'
import { Creator } from './core/creator.js'

const CLI_OPTIONS = {
  packageManager: {
    type: 'string',
    short: 'p',
    values: ['pnpm', 'npm', 'yarn'], // 限制可选值
  },
  // uiFramework: {
  //   type: 'string',
  //   short: 'u',
  //   values: ['element-plus', 'ant-design-vue', '@arco-design/web-vue', 'naive-ui', 'none'],
  // },
  // gitWorkflowTools: {
  //   type: 'string',
  //   short: 'g',
  //   transform: (value) => value.split(','), // 转换函数
  // },
  // cssTools: {
  //   type: 'string',
  //   short: 'c',
  //   transform: (value) => value.split(','),
  //   values: ['unocss', 'tailwindcss', 'none'],
  // },
}

async function main() {
  // 显示欢迎 banner
  showWelcomeBanner()

  // 解析命令行参数
  const { values: argv, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: CLI_OPTIONS,
    strict: false,
  })

  // 验证选项
  const cliOptions = validateOptions({
    projectName: positionals[0],
    packageManager: argv.packageManager,
    uiFramework: argv.uiFramework,
    gitWorkflowTools: argv.gitWorkflowTools ? argv.gitWorkflowTools.split(',') : undefined,
    cssTools: argv.cssTools ? argv.cssTools.split(',') : undefined,
  })

  // 创建项目
  await new Creator(cliOptions).create()
}

main().catch((err) => {
  console.log(chalk.red('\n☠️  发生错误:'), err)
  process.exit(1)
})
