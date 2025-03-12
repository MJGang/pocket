import path from 'node:path'
import { getPackageVersions, updatePackageDependencies } from '../utils/dependencies.js'
import hbscmd from 'hbs-commander'

// 预处理器包映射
const PREPROCESSOR_PACKAGES = {
  scss: ['sass'],
  less: ['less'],
  none: [],
}

// CSS工具包配置
const CSS_TOOL_PACKAGES = {
  unocss: {
    dev: ['unocss', '@unocss/preset-uno', '@unocss/preset-attributify', '@unocss/preset-icons'],
  },
  tailwindcss: {
    dev: ['tailwindcss', 'postcss', 'autoprefixer'],
  },
}

export async function setupCSSTools(projectDir, preprocessor, tool, onProgress) {
  const progressSteps = {
    init: 0.1,
    preprocessorInstalled: 0.3,
    toolDepsInstalled: 0.6,
    templatesRendered: 1,
  }

  try {
    if (onProgress) onProgress(progressSteps.init)

    // 处理预处理器
    const preprocessorPkgs = PREPROCESSOR_PACKAGES[preprocessor] || []
    if (preprocessorPkgs.length > 0) {
      const versions = await getPackageVersions(preprocessorPkgs)
      await updatePackageDependencies(projectDir, versions, true)
      if (onProgress) onProgress(progressSteps.preprocessorInstalled)
    }

    // 处理CSS工具
    const { dev = [] } = CSS_TOOL_PACKAGES[tool] || {}
    if (dev.length > 0) {
      const versions = await getPackageVersions(dev)
      await updatePackageDependencies(projectDir, versions, true)
      if (onProgress) onProgress(progressSteps.toolDepsInstalled)
    }

    // 渲染对应模板
    await hbscmd({
      template: path.join(__dirname, `../templates/css-tools/${tool}`),
      target: projectDir,
    })
    if (onProgress) onProgress(progressSteps.templatesRendered)
  } catch (error) {
    if (onProgress) onProgress('failed')
    console.error(`修改CSS工具失败: ${error}`)
    throw error
  }
}
