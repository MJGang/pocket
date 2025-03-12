import path from 'node:path'
import hbscmd from 'hbs-commander'
import { getPackageVersions, updatePackageDependencies } from '../utils/dependencies.js'

export async function setupUIFramework(projectDir, framework, onProgress) {
  if (framework === 'none') return

  const progressSteps = {
    init: 0.1,
    depsInstalled: 0.3,
    pluginsInstalled: 0.6,
    templatesRendered: 1,
  }

  try {
    if (onProgress) onProgress(progressSteps.init)

    const uiCommands = {
      'element-plus': {
        install: ['element-plus'],
        plugins: ['unplugin-vue-components', 'unplugin-auto-import'],
      },
      'ant-design-vue': {
        install: ['ant-design-vue'],
        plugins: ['unplugin-vue-components'],
      },
    }

    const { install, plugins } = uiCommands[framework]

    // 获取 UI 框架依赖
    const dependencies = await getPackageVersions(install)
    await updatePackageDependencies(projectDir, dependencies)
    if (onProgress) onProgress(progressSteps.depsInstalled)

    // 获取插件依赖
    if (plugins.length > 0) {
      const devDependencies = await getPackageVersions(plugins)
      await updatePackageDependencies(projectDir, devDependencies, true)
      if (onProgress) onProgress(progressSteps.pluginsInstalled)
    }

    // 修改框架相关文件
    await hbscmd({
      template: path.join(__dirname, `../templates/ui-framework/${framework}`),
      target: projectDir,
    })
    if (onProgress) onProgress(progressSteps.templatesRendered)
  } catch (error) {
    if (onProgress) onProgress('failed')
    console.error(`修改框架相关文件失败: ${error}`)
    throw error
  }
}
