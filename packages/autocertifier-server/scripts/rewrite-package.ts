import pkg from "../package.json" assert { type: "json" }
import * as fs from "node:fs"
import path, { dirname } from "node:path"
import prettier, { Options } from "prettier"
import { fileURLToPath } from "url"

const prettierOptions: Options = {
    parser: "json",
    tabWidth: 2,
}

const {
    type: _type,
    module: _module,
    types: _types,
    devDependencies: _devDependencies,
    scripts: _scripts,
    private: _private,
    ...rest
} = pkg

const newPkg = {
    ...rest,
    main: "./cjs/src/exports.js",
    module: "./esm/src/exports.js",
    types: "./esm/src/exports.d.ts",
}

;(async () => {
    const dist = path.resolve(
        dirname(fileURLToPath(import.meta.url)),
        "../dist/package.json",
    )

    const newPackageJson = await prettier.format(
        JSON.stringify(newPkg),
        prettierOptions,
    )

    fs.writeFileSync(dist, newPackageJson)
})()
