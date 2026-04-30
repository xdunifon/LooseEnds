import pluginVue from 'eslint-plugin-vue'
import { globalIgnores } from 'eslint/config'
import skipFormatting from 'eslint-config-prettier/flat'
import { vueTsConfigs } from '@vue/eslint-config-typescript'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,ts,mjs,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  skipFormatting,
]
