import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import * as esbuild from 'esbuild';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .envを注入
const define = Object.fromEntries(
    Object.entries(process.env).map(([k, v]) => [
        `process.env.${k}`,
        JSON.stringify(v),
    ]),
);

await esbuild
    .build({
        entryPoints: ['src/handlers/aws/serverless.ts'],
        minify     : true,
        bundle     : true,
        outfile    : 'dist/index.mjs',
        format     : 'esm',
        platform   : 'node',
        define,
        banner     : {
            js: 'import{createRequire}from\'module\';const require=createRequire(import.meta.url);',
        },
        resolveExtensions: ['.ts', '.js', '.json'],
        alias            : {
            '@handlers': resolve(__dirname, './src/handlers'),
            '@services': resolve(__dirname, './src/services'),
        },
    })
    .catch(() => process.exit(1));
