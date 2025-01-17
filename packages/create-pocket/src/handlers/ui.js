import fs from 'node:fs/promises'
import path from 'node:path'
import axios from 'axios'
import { createTemplateRenderer } from '../utils/index.js'

const REGISTRY_URLS = ['https://registry.npmjs.org', 'https://registry.npmmirror.com']

async function updatePackageJson(projectDir, dependencies) {
  const packageJsonPath = path.join(projectDir, 'package.json')
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))

  packageJson.dependencies = packageJson.dependencies || {}
  for (const [pkg, version] of Object.entries(dependencies)) {
    packageJson.dependencies[pkg] = version
  }

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

async function getLatestVersion(packageName) {
  const sources = REGISTRY_URLS.map(() => axios.CancelToken.source())

  try {
    const response = await Promise.race(
      REGISTRY_URLS.map((registry, index) =>
        axios
          .get(`${registry}/${packageName}`, {
            cancelToken: sources[index].token,
          })
          .then((response) => {
            // 取消其他请求
            sources.forEach((source, i) => {
              if (i !== index) source.cancel()
            })
            return response
          }),
      ),
    )

    return `^${response.data['dist-tags'].latest}`
  } catch (error) {
    if (!axios.isCancel(error)) {
      console.warn(`获取${packageName}版本失败:`, error.message)
    }
    return 'latest'
  } finally {
    // 清理所有取消token
    sources.forEach((source) => source.cancel())
  }
}

export async function setupUIFramework(projectDir, framework, onProgress) {
  if (framework === 'none') return

  if (onProgress) onProgress(0.1)

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

  // 获取 UI 框架依赖的最新版本
  const dependencies = await Promise.all(
    install.map(async (pkg) => {
      const version = await getLatestVersion(pkg)
      return { [pkg]: version }
    }),
  ).then((results) => Object.assign({}, ...results))

  await updatePackageJson(projectDir, dependencies)
  if (onProgress) onProgress(0.3)

  // 获取插件依赖的最新版本
  if (plugins.length > 0) {
    const devDependencies = await Promise.all(
      plugins.map(async (pkg) => {
        const version = await getLatestVersion(pkg)
        return { [pkg]: version }
      }),
    ).then((results) => Object.assign({}, ...results))

    await updatePackageJson(projectDir, devDependencies)
    if (onProgress) onProgress(0.6)
  }

  // 使用模板渲染器更新配置
  const renderer = createTemplateRenderer(projectDir)

  // 渲染UI框架模板
  renderer.render(`ui-framework/${framework}`)

  // 执行回调
  await renderer.executeCallbacks()

  if (onProgress) onProgress(1)
}
