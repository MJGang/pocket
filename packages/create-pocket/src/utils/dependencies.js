import { getLatestVersion } from './version.js'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const PACKAGES = {
  'element-plus': {
    dependencies: ['element-plus'],
    devDependencies: ['unplugin-vue-components', 'unplugin-auto-import'],
  },
  'ant-design-vue': {
    dependencies: ['ant-design-vue'],
    devDependencies: ['unplugin-vue-components'],
  },
  scss: {
    devDependencies: ['sass'],
  },
  less: {
    devDependencies: ['less'],
  },
  unocss: {
    devDependencies: [
      'unocss',
      '@unocss/preset-uno',
      '@unocss/preset-attributify',
      '@unocss/preset-icons',
    ],
  },
  tailwindcss: {
    devDependencies: ['tailwindcss', 'postcss', 'autoprefixer'],
  },
  husky: {
    devDependencies: ['husky'],
  },
  'lint-staged': {
    devDependencies: ['lint-staged'],
  },
  commitlint: {
    devDependencies: ['@commitlint/cli', '@commitlint/config-conventional'],
  },
  changelog: {
    devDependencies: ['conventional-changelog-cli'],
  },
}

/**
 * 更新项目package.json中的依赖项
 * @param {string} projectDir - 项目目录
 * @param {Object} dependencies - 要添加的依赖项
 * @param {boolean} [isDev=false] - 是否为开发依赖
 */
async function updatePackageDependencies(projectDir, dependencies, isDev = false) {
  const packageJsonPath = path.join(projectDir, 'package.json')
  const json = await readFile(packageJsonPath, 'utf-8')
  let packageJson = JSON.parse(json)

  const targetKey = isDev ? 'devDependencies' : 'dependencies'
  packageJson[targetKey] = packageJson[targetKey] || {}

  for (const [pkg, version] of Object.entries(dependencies)) {
    packageJson[targetKey][pkg] = version
  }

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

/**
 * 批量获取包的最新版本
 * @param {string[]} packages - 包名数组
 * @returns {Promise<Object>} 包名到版本的映射
 */
async function getPackageVersions(packages) {
  const versionMap = await Promise.all(
    packages.map(async (pkg) => {
      const version = await getLatestVersion(pkg)
      return { [pkg]: version }
    }),
  ).then((results) => Object.assign({}, ...results))

  return versionMap
}

/**
 * 更新项目package.json中的依赖项
 * @param {string} projectDir - 项目目录
 * @param {string} name - 需要安装的工具
 * @returns {Promise<void>}
 * @throws {Error} 配置失败时抛出错误
 */
export async function updatePackageJson(projectDir, name) {
  const { dependencies = [], devDependencies = [] } = PACKAGES[name]
  if (dependencies.length > 0) {
    const versions = await getPackageVersions(dependencies)
    await updatePackageDependencies(projectDir, versions)
  }
  if (devDependencies.length > 0) {
    const devVersions = await getPackageVersions(devDependencies)
    await updatePackageDependencies(projectDir, devVersions, true)
  }
}
