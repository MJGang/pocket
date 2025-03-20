import chalk from 'chalk'
import ora from 'ora'
import { MultiBar } from 'cli-progress'

class PocketLogger {
  static prefix = `[${chalk.cyan('create-pocket')}]`
  static progressBars = {}
  static multiBar = null

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

  static initProgress(tasks) {
    this.multiBar = new MultiBar({
      format: '{title} [{bar}] {percentage}%',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      barGlue: ' ',
      align: 'left',
    })

    const totalTasks = Object.keys(tasks).length
    Object.entries(tasks).forEach(([key, { title }], index) => {
      this.progressBars[key] = this.multiBar.create(100, 0, {
        title: `[${index + 1}/${totalTasks}] ${title}`,
      })
    })
  }

  static updateProgress(type, status) {
    const bar = this.progressBars[type]
    if (!bar) return

    bar.update(
      status === 'success'
        ? 100
        : status === 'failed'
          ? 0
          : typeof status === 'number'
            ? Math.floor(status * 100)
            : 30,
    )
  }

  static stopProgress() {
    if (this.multiBar) {
      this.multiBar.stop()
      this.multiBar = null
      this.progressBars = {}
    }
  }
}

export { PocketLogger }
