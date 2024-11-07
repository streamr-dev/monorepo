import resolve from "@rollup/plugin-node-resolve"
import { basename, extname } from "node:path"
import esbuild from "rollup-plugin-esbuild"

const production = !process.env.ROLLUP_WATCH

function config(filename) {
    const input = `src/${filename}`

    const outputFilename = `${basename(filename, extname(filename))}`

    return [
        {
            input,
            output: {
                file: `dist/${outputFilename}.cjs.js`,
                format: "cjs",
                sourcemap: !production,
            },
            external: [
                "jest-matcher-utils",
                "cors",
                "express",
                "ethers",
                "node-fetch",
                "lodash/random",
                "@streamr/utils",
            ],
            plugins: [
                resolve({
                    preferBuiltins: true,
                    resolveOnly: [],
                }),
                esbuild({
                    target: "esnext",
                    sourcemap: !production,
                    tsconfig: "./tsconfig.node.json",
                }),
            ],
        },
        {
            input,
            output: {
                file: `dist/${outputFilename}.esm.js`,
                format: "es",
                sourcemap: !production,
            },
            external: [
                "jest-matcher-utils",
                "cors",
                "express",
                "ethers",
                "node-fetch",
                "lodash/random",
                "@streamr/utils",
            ],
            plugins: [
                resolve({
                    preferBuiltins: true,
                    resolveOnly: [],
                }),
                esbuild({
                    target: "esnext",
                    sourcemap: !production,
                    tsconfig: "./tsconfig.node.json",
                }),
            ],
        },
    ]
}

export default [
    ...config("customMatchers.ts"),
    ...config("index.ts"),
    ...config("setupCustomMatchers.ts"),
]
