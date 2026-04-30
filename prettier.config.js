/**
 * @type {import("prettier").Config}
 */
const config = {
  overrides: [
    {
      files: ['**/*.js'],
      options: {
        tabWidth: 2,
        printWidth: 100,
        useTabs: false,
        semi: false,
        singleQuote: true,
        trailingComma: 'all',
        bracketSpacing: true,
        arrowParens: 'always',
        endOfLine: 'lf',
        quoteProps: 'as-needed',
      },
    },
    {
      files: ['**/*.ts'],
      options: {
        tabWidth: 2,
        printWidth: 100,
        useTabs: false,
        semi: false,
        singleQuote: true,
        trailingComma: 'all',
        bracketSpacing: true,
        arrowParens: 'always',
        endOfLine: 'lf',
        quoteProps: 'as-needed',
      },
    },
    {
      files: ['**/*.mts'],
      options: {
        tabWidth: 2,
        printWidth: 100,
        useTabs: false,
        semi: false,
        singleQuote: true,
        trailingComma: 'all',
        bracketSpacing: true,
        arrowParens: 'always',
        endOfLine: 'lf',
        quoteProps: 'as-needed',
      },
    },
    {
      files: ['**/*.css'],
      options: {
        tabWidth: 2,
        printWidth: 100,
        useTabs: false,
        singleQuote: false,
        embeddedLanguageFormatting: 'auto',
        endOfLine: 'lf',
      },
    },
  ],
}

export default config
