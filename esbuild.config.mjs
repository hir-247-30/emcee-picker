import * as esbuild from 'esbuild';
import dotenv from 'dotenv';

dotenv.config();

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
        outfile    : 'dist/aws-serverless.mjs',
        format     : 'esm',
        platform   : 'node',
        define,
        banner     : {
            js: 'import{createRequire}from\'module\';const require=createRequire(import.meta.url);',
        },
    })
    .catch(() => process.exit(1));
