import chalk from 'chalk'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const { blue, white, red } = chalk

// 获取当前文件的目录
const __dirname = dirname(fileURLToPath(import.meta.url))

// 读取 package.json
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'))
// 描边颜色
const borderColor = red

const banners = {
  gradientBanner: `${blue('██████') + borderColor('╗  ') + blue('██████') + borderColor('╗  ') + blue('██████') + borderColor('╗') + blue('██') + borderColor('╗  ') + blue('██') + borderColor('╗') + blue('███████') + borderColor('╗') + blue('████████') + borderColor('╗')}
${blue('██') + borderColor('╔══') + blue('██') + borderColor('╗') + blue('██') + borderColor('╔═══') + blue('██') + borderColor('╗') + blue('██') + borderColor('╔════╝') + blue('██') + borderColor('║ ') + blue('██') + borderColor('╔╝') + blue('██') + borderColor('╔════╝╚══') + blue('██') + borderColor('╔══╝')}
${white('██████') + borderColor('╔╝') + white('██') + borderColor('║   ') + white('██') + borderColor('║') + white('██') + borderColor('║     ') + white('█████') + borderColor('╔╝ ') + white('█████') + borderColor('╗     ') + white('██') + borderColor('║   ')}
${blue('██') + borderColor('╔═══╝ ') + blue('██') + borderColor('║   ') + blue('██') + borderColor('║') + blue('██') + borderColor('║     ') + blue('██') + borderColor('╔═') + blue('██') + borderColor('╗ ') + blue('██') + borderColor('╔══╝     ') + blue('██') + borderColor('║   ')}
${blue('██') + borderColor('║     ╚') + blue('██████') + borderColor('╔╝╚') + blue('██████') + borderColor('╗') + blue('██') + borderColor('║  ') + blue('██') + borderColor('╗') + blue('███████') + borderColor('╗   ') + blue('██') + borderColor('║   ')}
${borderColor('╚═╝      ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝   ')}
${blue('═══════ ════════ ═══════ ═══════ ═══════ ═══════')}`,

  defaultBanner: `
  ____   ___   ____ _  _______ _____
 |  _ \\ / _ \\ / ___| |/ / ____|_   _|
 | |_) | | | | |   | ' /|  _|   | |
 |  __/| |_| | |___| . \\| |___  | |
 |_|    \\___/ \\____|_|\\_\\_____| |_|
`,

  // 版本信息
  versionInfo: (version) => `版本号: v-${version}`,
}

export function showWelcomeBanner() {
  // 添加空行
  console.log()

  // 根据终端能力选择合适的 banner
  console.log(
    process.stdout.isTTY && process.stdout.getColorDepth() > 8
      ? banners.gradientBanner
      : banners.defaultBanner,
  )

  // 显示版本信息
  console.log(blue(banners.versionInfo(pkg.version)))

  // 添加空行
  console.log()
}
