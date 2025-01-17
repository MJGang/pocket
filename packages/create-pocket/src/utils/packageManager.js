import { packageManagerCommands } from '../config/commands.js'

export function getPackageManagerCommands(packageManager) {
  return packageManagerCommands[packageManager] || {}
}
