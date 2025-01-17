/**
 * 对package.json的依赖项进行排序
 * @param {Object} pkg package.json对象
 * @returns {Object} 排序后的package.json对象
 */
export default function sortDependencies(pkg) {
  const sorted = {}

  const depTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

  for (const depType of depTypes) {
    if (pkg[depType]) {
      sorted[depType] = {}

      Object.keys(pkg[depType])
        .sort()
        .forEach((name) => {
          sorted[depType][name] = pkg[depType][name]
        })
    }
  }

  return {
    ...pkg,
    ...sorted,
  }
}
