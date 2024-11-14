import resolve from "@rollup/plugin-node-resolve"
import copy from "rollup-plugin-copy"
import pkg from "./package.json" assert { type: "json" }

export default [
    {
        input: "build/src/exports.js",
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
        plugins: [
            resolve({
                preferBuiltins: true,
            }),
            copy({
                targets: [{ src: ["README.md"], dest: "dist" }],
            }),
        ],
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.devDependencies || {}),
        ],
    },
]
