import alias from "@rollup/plugin-alias"
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import resolve from "@rollup/plugin-node-resolve"
import path, { dirname } from "path"
import copy from "rollup-plugin-copy"
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
        input: "build/src/exports.js",
        onwarn,
        output: [
            {
                file: "dist/bundle.cjs.js",
                format: "cjs",
                sourcemap: true,
            },
            {
                file: "dist/bundle.esm.js",
                format: "es",
                sourcemap: true,
            },
        ],
        plugins: [nodePolyfills(), json(), resolve(), commonjs()],
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.devDependencies || {}),
        ],
    },
    {
        input: "build/src/exports.js",
        onwarn,
        output: [
            {
                file: "dist/bundle.umd.js",
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
                            "build/src/browser/Logger.js",
                        ),
                    },
                ],
            }),
            nodePolyfills(),
            json(),
            resolve(),
            commonjs(),
            copy({
                targets: [{ src: ["README.md", "LICENSE"], dest: "dist" }],
            }),
        ],
    },
]
