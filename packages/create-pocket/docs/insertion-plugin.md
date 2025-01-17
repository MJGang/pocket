# Insertion Plugin 文档

## 介绍

Insertion Plugin 提供了一个灵活的方式，在模板渲染时将内容插入到文件的特定位置。

## 安装

```bash
npm install @pocket/insertion-plugin
```

## 使用

### 基本用法

```js
import InsertionPlugin from '@pocket/insertion-plugin'

const insertionPlugin = new InsertionPlugin()
```

### 添加规则

```js
insertionPlugin.addRule({
  fileType: 'js', // 或 'vue', 'css'
  position: 'afterImports', // 内置位置
  content: 'import MyComponent from "./MyComponent"',
})
```

### 内置位置

#### JavaScript (js)

- `afterImports`: 在最后一个import语句后

#### Vue (vue)

- `beforeMainComponent`: 在主组件定义前
- `styleSection`: 在style部分

### 示例

```js
const insertionPlugin = new InsertionPlugin()

// 添加规则以插入组件导入
insertionPlugin.addRule({
  fileType: 'js',
  position: 'afterImports',
  content: 'import MyComponent from "./MyComponent"',
})

// 添加规则以插入组件使用
insertionPlugin.addRule({
  fileType: 'vue',
  position: 'beforeMainComponent',
  content: '<MyComponent />',
})

// 与模板渲染器一起使用
renderTemplate(template, {
  plugins: [insertionPlugin],
})
```

## API 参考

### InsertionPlugin

- `constructor()`: 创建新的InsertionPlugin实例
- `addRule(rule)`: 添加新的插入规则
- `apply(content, filePath)`: 将规则应用于内容

### 规则对象

- `fileType`: 要应用规则的文件类型 ('js', 'vue', 'css')
- `position`: 插入内容的位置（内置或自定义）
- `content`: 要插入的内容
