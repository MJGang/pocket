import { getLatestVersion } from './version.js'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * 更新项目package.json中的依赖项
 * @param {string} projectDir - 项目目录
 * @param {Object} dependencies - 要添加的依赖项
 * @param {boolean} [isDev=false] - 是否为开发依赖
 */
export async function updatePackageDependencies(projectDir, dependencies, isDev = false) {
  const packageJsonPath = path.join(projectDir, 'package.json')
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

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
export async function getPackageVersions(packages) {
  const versionMap = await Promise.all(
    packages.map(async (pkg) => {
      const version = await getLatestVersion(pkg)
      return { [pkg]: version }
    }),
  ).then((results) => Object.assign({}, ...results))

  return versionMap
}
