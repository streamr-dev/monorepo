import resolve from "@rollup/plugin-node-resolve"
import { basename, extname } from "node:path"
import pkg from "./package.json" assert { type: "json" }

function config(filename) {
    const outputBasename = `${basename(filename, extname(filename))}`

    return {
        input: `build/src/${filename}`,
        output: [
            {
                file: `dist/${outputBasename}.cjs.js`,
                format: "cjs",
                sourcemap: true,
            },
            {
                file: `dist/${outputBasename}.esm.js`,
                format: "es",
                sourcemap: true,
            },
        ],
        plugins: [
            resolve({
                preferBuiltins: true,
            }),
        ],
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.devDependencies || {}),
            "lodash/random",
        ],
    }
}

export default [
    config("customMatchers.js"),
    config("index.js"),
    config("setupCustomMatchers.js"),
]
