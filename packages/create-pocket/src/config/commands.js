export const packageManagerCommands = {
  pnpm: {
    install: 'pnpm install',
    add: 'pnpm add',
    run: 'pnpm',
    create: 'pnpm create',
  },
  npm: {
    install: 'npm install',
    add: 'npm install',
    run: 'npm run',
    create: 'npm create',
  },
  yarn: {
    install: 'yarn install',
    add: 'yarn add',
    run: 'yarn',
    create: 'yarn create',
  },
  bun: {
    install: 'bun install',
    add: 'bun add',
    run: 'bun',
    create: 'bun create',
  },
}

export const packageManagerList = Object.keys(packageManagerCommands).map((key) => ({
  title: key,
  value: key,
}))
