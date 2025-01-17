// function isValidPackageName(projectName) {
//   return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName)
// }

// 验证项目名称
export function isValidProjectName(name) {
  if (!name) return true

  // 允许的字符：字母、数字、下划线、连字符
  const regex = /^[a-zA-Z0-9-_]+$/
  return regex.test(name)
}

// 验证包管理器
function isValidPackageManager(pm) {
  if (!pm) return true // 允许为空，使用默认值
  return ['pnpm', 'npm', 'yarn'].includes(pm)
}

// 验证 UI 框架
function isValidUIFramework(framework) {
  if (!framework) return true // 允许为空，使用默认值
  return ['element-plus', 'ant-design-vue', '@arco-design/web-vue', 'naive-ui', 'none'].includes(
    framework,
  )
}

// 验证 Git 工具
function isValidGitWorkflowTools(tools) {
  if (!tools) return true // 允许为空，使用默认值

  const validTools = ['husky', 'lint-staged', 'commitlint', 'changelog']
  return tools.every((tool) => validTools.includes(tool))
}

// 主验证函数
export function validateOptions(options) {
  const errors = []

  // 1. 验证项目名称
  if (!isValidProjectName(options.projectName)) {
    errors.push('无效的项目名称，只能包含字母、数字、下划线和连字符')
  }

  // 2. 验证包管理器
  if (!isValidPackageManager(options.packageManager)) {
    errors.push('不支持的包管理器，请使用 pnpm、npm 或 yarn')
  }

  // 3. 验证 UI 框架
  if (!isValidUIFramework(options.uiFramework)) {
    errors.push('不支持的 UI 框架')
  }

  // 4. 验证 Git 工具
  if (options.gitWorkflowTools && !isValidGitWorkflowTools(options.gitWorkflowTools)) {
    errors.push('包含不支持的 Git 工具')
  }

  // 如果有错误，抛出异常
  if (errors.length > 0) {
    throw new Error(errors.join('\n'))
  }

  return options
}
