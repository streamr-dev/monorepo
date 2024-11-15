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
            import: "./esm/src/index.js",
            require: "./cjs/src/index.js",
            types: "./esm/src/index.d.ts",
        },
        "./customMatchers": {
            import: "./esm/src/customMatchers.js",
            require: "./cjs/src/customMatchers.js",
            types: "./esm/src/customMatchers.d.ts",
        },
        "./setupCustomMatchers": {
            import: "./esm/src/setupCustomMatchers.js",
            require: "./cjs/src/setupCustomMatchers.js",
            types: "./esm/src/setupCustomMatchers.d.ts",
        },
        "./customMatcherTypes": {
            types: "./esm/src/customMatchersTypes.d.ts",
        },
    },
    main: "./cjs/src/index.js",
    module: "./esm/src/index.js",
    types: "./esm/src/index.d.ts",
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
