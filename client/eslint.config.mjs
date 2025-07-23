import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  typescript: true,
  markdown: true,
  formatters: {
    css: true,
    html: true,
  },
  ignores: [
    '**/routeTree.gen.ts',
  ],
})
