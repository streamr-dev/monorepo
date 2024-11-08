import resolve from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"

const pkg = require("./package.json")

export default {
    input: "src/exports.ts",
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
    external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
    ],
    plugins: [
        resolve(),
        typescript({
            outputToFilesystem: true,
        }),
    ],
}
