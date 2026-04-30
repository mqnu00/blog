import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig, globalIgnores } from 'eslint/config'
import { gitignore } from 'eslint-flat-config-gitignore'
import { importX } from 'eslint-plugin-import-x'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import fs from 'fs'
import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'
import tseslint from 'typescript-eslint'

function loadAutoImportGlobals() {
  const file = './eslintrc-auto-import.json'
  if (!fs.existsSync(file)) return {}
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  return json.globals || {}
}

const gitignoreFiles = await gitignore(import.meta.dirname)

export default defineConfig([
  gitignoreFiles,
  globalIgnores(['./blog/.vitepress/utils/github/graphql/github.ts', '**/*.d.ts']),

  pluginVue.configs['flat/recommended'],
  importX.configs['flat/recommended'],
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: ['./tsconfig.json'],
          extensions: ['.ts', '.mts', '.js'], // 必须加
          alias: [
            ['@blog', './blog'], // 必须是数组
          ],
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
        }),
      ],
    },
  },

  {
    files: ['**/*.mts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: ['./tsconfig.json'],
          extensions: ['.ts', '.mts', '.js'], // 必须加
          alias: [
            ['@blog', './blog'], // 必须是数组
          ],
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
        }),
      ],
    },
  },

  {
    files: ['**/*.vue'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'vue/multi-word-component-names': [
        'error',
        {
          ignores: ['App', 'Index', 'Page', 'Layout', 'Friend'],
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
    files: ['blog/**/*.{js,mjs,cjs}'],
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
