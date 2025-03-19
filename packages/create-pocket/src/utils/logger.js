import chalk from 'chalk'
import ora from 'ora'

class PocketLogger {
  static prefix = `[${chalk.cyan('create-pocket')}]`

  static info(message, ...args) {
    console.log(this.prefix, message, ...args)
  }

  static success(message, ...args) {
    console.log(this.prefix, chalk.green(message), ...args)
  }

  static warning(message, ...args) {
    console.warn(this.prefix, chalk.yellow(message), ...args)
  }

  static error(message, ...args) {
    console.error(this.prefix, chalk.red(message), ...args)
  }

  static spinner(message) {
    return {
      start: () => ora(`${this.prefix} ${message}`).start(),
      succeed: (message) => ora(`${this.prefix} ${message}`).succeed(),
      fail: (message) => ora(`${this.prefix} ${message}`).fail(),
    }
  }
}

export { PocketLogger }
