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
    devDependencies: _devDependencies,
    scripts: _scripts,
    private: _private,
    exports: _exports,
    ...rest
} = pkg

const newPkg = {
    ...rest,
    exports: {
        ".": {
            import: "./index.esm.js",
            require: "./index.cjs.js",
            types: "./index.d.ts",
        },
        "./customMatchers": {
            import: "./customMatchers.esm.js",
            require: "./customMatchers.cjs.js",
            types: "./customMatchers.d.ts",
        },
        "./setupCustomMatchers": {
            import: "./setupCustomMatchers.esm.js",
            require: "./setupCustomMatchers.cjs.js",
            types: "./setupCustomMatchers.d.ts",
        },
        "./customMatcherTypes": {
            types: "./customMatchersTypes.d.ts",
        },
    },
    main: "./index.cjs.js",
    module: "./index.esm.js",
    types: "./index.d.ts",
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
