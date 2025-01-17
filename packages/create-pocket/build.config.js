import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  type: 'module',
  entries: ['src/index'],
  clean: true,
  rollup: {
    inlineDependencies: true,
    esbuild: {
      target: 'node18',
      minify: true,
    },
    // 添加这个配置
    commonjs: {
      ignore: ['prompts'],
    },
  },
})
