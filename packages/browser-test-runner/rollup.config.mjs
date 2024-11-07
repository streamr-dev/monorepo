import resolve from "@rollup/plugin-node-resolve"
import { dts } from "rollup-plugin-dts"
import esbuild from "rollup-plugin-esbuild"

const production = !process.env.ROLLUP_WATCH

export default [
    {
        input: "src/exports.ts",
        output: {
            file: "dist/bundle.cjs.js",
            format: "cjs",
            sourcemap: !production,
        },
        external: ["webpack", "node-polyfill-webpack-plugin"],
        plugins: [
            resolve({
                preferBuiltins: true,
                resolveOnly: []
            }),
            esbuild({
                target: "esnext",
                sourcemap: !production,
                tsconfig: "./tsconfig.node.json",
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
        external: ["webpack", "node-polyfill-webpack-plugin"],
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
        input: "src/exports.ts",
        output: {
            file: "dist/types.d.ts",
            format: "es",
        },
        external: ["webpack", "node-polyfill-webpack-plugin"],
        plugins: [
            resolve({
                preferBuiltins: true,
                resolveOnly: [],
            }),
            dts({
                tsconfig: "./tsconfig.node.json",
            }),
        ],
    },
]
