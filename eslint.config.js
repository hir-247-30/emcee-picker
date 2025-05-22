import { defineConfig, globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import vitest from '@vitest/eslint-plugin';

export default defineConfig(
    globalIgnores(['dist', 'coverage', 'node_modules']),
    eslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                projectService : true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    // 全て
    {
        files  : ['**/*.{js,ts,mjs}'],
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            '@stylistic/space-before-function-paren': 'error',

            '@stylistic/semi'       : 'error',
            '@stylistic/indent'     : ['error', 4],
            '@stylistic/key-spacing': ['error', {
                beforeColon: false,
                afterColon : true,
                align      : 'colon',
            }],
        },
    },
    // 設定ファイル・スクリプト
    {
        files          : ['*.config.{js,ts,mjs}'],
        languageOptions: {
            globals: { process: 'readonly' },
        },
    },
    // アプリケーション
    {
        files  : ['src/**/*.ts'],
        extends: [
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        languageOptions: {
            sourceType: 'module',
        },
    },
    // テストファイル用: VitestグローバルAPI
    {
        files  : ['**/*.test.ts'],
        plugins: {
            '@vitest': vitest,
        },
        rules: {
            ...vitest.configs.recommended.rules,
        },
        settings: {
            vitest: {
                typeCheck: true,
            },
        },
        languageOptions: {
            globals: {
                ...vitest.environments.env.globals,
            },
        },
    },
);