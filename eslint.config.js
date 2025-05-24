import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import importPlugin from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

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
            'import'    : importPlugin,
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project       : './tsconfig.json',
                }
            },
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
            '@stylistic/operator-linebreak': ['error', 'before', {
                overrides: {
                    '=': 'none',
                },
            }],
            
            // import順のルール
            'import/order': ['error', {
                'groups'          : ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
                'newlines-between': 'always',
                'alphabetize'     : {
                    'order'          : 'asc',
                    'caseInsensitive': true
                },
                'pathGroups': [
                    {
                        'pattern' : '@handlers/**',
                        'group'   : 'internal',
                        'position': 'before'
                    },
                    {
                        'pattern' : '@services/**',
                        'group'   : 'internal',
                        'position': 'before'
                    }
                ],
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
    // テスト
    {
        files  : ['src/test/**/*.ts'],
        plugins: {
            'vitest': vitest,
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