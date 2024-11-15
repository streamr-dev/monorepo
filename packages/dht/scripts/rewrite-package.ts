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
    module: _module,
    private: _private,
    scripts: _scripts,
    type: _type,
    types: _types,
    ...rest
} = pkg

const newPkg = {
    ...rest,
    main: "./cjs/src/exports.js",
    module: "./esm/src/esports.js",
    types: "./esm/src/esports.d.ts",
    browser: {
        "./cjs/src/connection/webrtc/NodeWebrtcConnection.js":
            "./cjs/src/connection/webrtc/BrowserWebrtcConnection.js",
        "./esm/src/connection/webrtc/NodeWebrtcConnection.js":
            "./esm/src/connection/webrtc/BrowserWebrtcConnection.js",
        "./cjs/src/connection/websocket/NodeWebsocketClientConnection.js":
            "./cjs/src/connection/websocket/BrowserWebsocketClientConnection.js",
        "./esm/src/connection/websocket/NodeWebsocketClientConnection.js":
            "./esm/src/connection/websocket/BrowserWebsocketClientConnection.js",
        "./cjs/src/helpers/browser/isBrowserEnvironment.js":
            "./cjs/src/helpers/browser/isBrowserEnvironment_override.js",
        "./esm/src/helpers/browser/isBrowserEnvironment.js":
            "./esm/src/helpers/browser/isBrowserEnvironment_override.js",
    },
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
