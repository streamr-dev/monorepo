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
    devDependencies: _devDependencies,
    scripts: _scripts,
    private: _private,
    ...newPkg
} = pkg

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
