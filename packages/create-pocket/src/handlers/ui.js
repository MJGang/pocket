import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import hbscmd from 'hbs-commander'

const REGISTRY_URLS = ['https://registry.npmmirror.com'] // 'https://registry.npmjs.org',

async function updatePackageJson(projectDir, dependencies) {
  const packageJsonPath = path.join(projectDir, 'package.json')
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

  packageJson.dependencies = packageJson.dependencies || {}
  for (const [pkg, version] of Object.entries(dependencies)) {
    packageJson.dependencies[pkg] = version
  }

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

async function getLatestVersion(packageName) {
  const controllers = REGISTRY_URLS.map(() => new AbortController())
  const requests = []
  for (let index = 0; index < REGISTRY_URLS.length; index++) {
    const registry = REGISTRY_URLS[index]
    const request = fetch(`${registry}/${packageName}`, {
      method: 'GET',
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'zh-CN,zh;q=0.9',
        'cache-control': 'max-age=0',
        'if-modified-since': 'Fri, 10 Jan 2025 14:28:27 GMT',
        'if-none-match': 'W/"3130243c01a23685dc13c59c9355a763"',
        priority: 'u=0, i',
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
      },
      signal: controllers[index].signal,
    })
      .then(async (response) => {
        // 取消其他请求
        controllers.forEach((controller, i) => {
          if (i !== index) controller.abort()
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        return response.json()
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.warn(`从${registry}获取${packageName}版本失败:`, error.message)
        }
        return null
      })
    requests.push(request)
  }

  try {
    // 等待所有请求完成
    const results = await Promise.all(requests)

    // 取第一个成功的响应
    const successResponse = results.find((response) => response !== null)
    if (successResponse) {
      return `^${successResponse['dist-tags'].latest}`
    }

    // 所有请求都失败
    return 'latest'
  } finally {
    // 清理所有AbortController
    controllers.forEach((controller) => controller.abort())
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

  // 修改框架相关文件
  await hbscmd({
    template: path.join(__dirname, `../templates/ui-framework/${framework}`),
    target: projectDir,
  }).catch((error) => {
    console.error(`修改框架相关文件失败: ${error}`)
  })

  if (onProgress) onProgress(1)
}
