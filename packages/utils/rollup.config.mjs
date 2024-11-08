import alias from "@rollup/plugin-alias"
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import resolve from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"
import path, { dirname } from "path"
import nodePolyfills from "rollup-plugin-polyfill-node"
import { terser } from "rollup-plugin-terser"
import { fileURLToPath } from "url"
import pkg from "./package.json" assert { type: "json" }

function onwarn(warning, defaultHandler) {
    if (warning.code !== "CIRCULAR_DEPENDENCY") {
        defaultHandler(warning)
    }
}

export default [
    {
        input: "src/exports.ts",
        onwarn,
        output: [
            {
                file: pkg.main,
                format: "cjs",
                sourcemap: true,
            },
            {
                file: pkg.module,
                format: "es",
                sourcemap: true,
            },
        ],
        plugins: [
            nodePolyfills(),
            json(),
            resolve(),
            commonjs(),
            typescript({
                outputToFilesystem: true,
            }),
        ],
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.devDependencies || {}),
        ],
    },
    {
        input: "src/exports.ts",
        onwarn,
        output: [
            {
                file: pkg.browser,
                format: "umd",
                name: pkg.name,
                sourcemap: true,
            },
            {
                file: "dist/bundle.umd.min.js",
                format: "umd",
                name: pkg.name,
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
            nodePolyfills(),
            json(),
            resolve(),
            commonjs(),
            typescript(),
        ],
        // external: [
        //     ...Object.keys(pkg.dependencies || {}),
        //     ...Object.keys(pkg.devDependencies || {}),
        // ],
    },
]
