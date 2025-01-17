import traverse from '@babel/traverse'

export const builtInRules = {
  js: {
    afterImports: {
      insert: (ast, content, newContent) => {
        // 找到最后一个import语句的位置
        let lastImportEnd = 0
        traverse(ast, {
          ImportDeclaration(path) {
            lastImportEnd = path.node.end
          },
        })

        // 在最后一个import语句后插入新内容
        if (lastImportEnd > 0) {
          return content.slice(0, lastImportEnd) + '\n' + newContent + content.slice(lastImportEnd)
        }
        return content
      },
    },
  },
  vue: {
    beforeMainComponent: {
      insert: (ast, content, newContent) => {
        // 找到template部分的开始位置
        const templateStart = ast.template.loc.start.offset
        return content.slice(0, templateStart) + newContent + '\n' + content.slice(templateStart)
      },
    },
    styleSection: {
      insert: (ast, content, newContent) => {
        // 找到最后一个style标签的位置
        if (ast.styles.length > 0) {
          const lastStyle = ast.styles[ast.styles.length - 1]
          return (
            content.slice(0, lastStyle.loc.end.offset) +
            '\n' +
            newContent +
            '\n' +
            content.slice(lastStyle.loc.end.offset)
          )
        }
        return content
      },
    },
  },
}
