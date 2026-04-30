import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint/config'
import { importX } from 'eslint-plugin-import-x'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import fs from 'fs'
import vueParser from 'vue-eslint-parser'

function loadAutoImportGlobals() {
  const file = './eslintrc-auto-import.json'
  if (!fs.existsSync(file)) return {}
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  return json.globals || {}
}

export default defineConfig([
  pluginVue.configs['flat/recommended'],
  importX.configs['flat/recommended'],

  {
    files: ['**/*.vue'],
    rules: {
      'no-useless-assignment': 'warn',
      'no-unused-vars': 'warn',
      'vue/multi-word-component-names': [
        'error',
        {
          ignores: ['App', 'Index'],
        },
      ],
    },
    languageOptions: {
      parser: vueParser,
      globals: {
        ...globals.browser,
        ...loadAutoImportGlobals(), // 自动导入
      },
      parserOptions: {
        parser: {
          ts: '@typescript-eslint/parser',
        },
        extraFileExtensions: ['.vue'],
      },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: ['./tsconfig.json'],
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
        }),
      ],
    },
  },

  {
    files: ['blog/**/*.{ts,js,mjs,mts,cjs}'],
    plugins: {
      js,
      import: importX,
    },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...loadAutoImportGlobals(), // 自动导入
      },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: ['./tsconfig.json'],
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
        }),
      ],
    },
  },

  // Node 环境
  {
    files: ['*.{js,mjs,cjs}'],
    plugins: {
      js,
      import: importX,
    },
    extends: ['js/recommended'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
