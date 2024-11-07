import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import esbuild from "rollup-plugin-esbuild"
import { terser } from "rollup-plugin-terser"
import json from "@rollup/plugin-json"
import nodePolyfills from "rollup-plugin-polyfill-node"
import alias from "@rollup/plugin-alias"
import { fileURLToPath } from "url"
import path, { dirname } from "path"
import { dts } from "rollup-plugin-dts"

const production = !process.env.ROLLUP_WATCH

export default [
    {
        input: "src/exports.ts",
        output: [
            {
                file: "dist/bundle.umd.js",
                format: "umd",
                name: "@streamr/utils",
                sourcemap: !production,
            },
            {
                file: "dist/bundle.umd.min.js",
                format: "umd",
                name: "@streamr/utils",
                sourcemap: false,
                plugins: [terser()],
            },
        ],
        plugins: [
            alias({
                entries: [
                    {
                        find: "./Logger",
                        replacement: path.resolve(
                            dirname(fileURLToPath(import.meta.url)),
                            "src/browser/Logger.ts"
                        ),
                    },
                ],
            }),
            nodePolyfills({
                include: ["os", "crypto", "stream", "fs", "path"],
            }),
            json(),
            resolve({
                preferBuiltins: false,
            }),
            commonjs(),
            esbuild({
                target: "es2020",
                minify: production,
                sourcemap: !production,
            }),
        ],
    },
    {
        input: "src/exports.ts",
        output: {
            file: "dist/bundle.cjs.js",
            format: "cjs",
            sourcemap: !production,
        },
        plugins: [
            json(),
            resolve({
                preferBuiltins: true,
            }),
            commonjs(),
            esbuild({
                target: "esnext",
                minify: production,
                sourcemap: !production,
            }),
        ],
    },
    {
        input: "src/exports.ts",
        output: {
            file: "dist/bundle.esm.js",
            format: "es",
            sourcemap: !production,
        },
        plugins: [
            json(),
            resolve({
                preferBuiltins: true,
            }),
            commonjs(),
            esbuild({
                target: "esnext",
                minify: production,
                sourcemap: !production,
            }),
        ],
    },
    {
        input: "src/exports.ts",
        output: {
            file: "dist/types.d.ts",
            format: "es",
        },
        plugins: [
            resolve({
                preferBuiltins: true,
            }),
            dts(),
        ],
    },
]
