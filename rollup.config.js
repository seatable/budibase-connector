import typescript from "@rollup/plugin-typescript"
import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import json from "rollup-plugin-json"
import terser from "@rollup/plugin-terser"
import fs from "fs"
import path from "path"
import { execSync } from "child_process"
import crypto from "crypto"

const pkg = JSON.parse(
  fs.readFileSync(path.join(import.meta.dirname, "package.json"), "utf-8")
)

export default {
  input: "src/index.ts",
  output: {
    file: "dist/plugin.min.js",
    format: "cjs",
    sourcemap: false,
  },
  plugins: [
    {
      name: "clean",
      buildStart() {
        if (fs.existsSync("dist")) {
          const distFiles = fs
            .readdirSync("dist")
            .filter((f) => f.endsWith(".tar.gz"))
          distFiles.forEach((f) => fs.unlinkSync(path.join("dist", f)))
        }
      },
    },
    typescript({
      tsconfig: false,
      target: "es6",
      module: "esnext",
      moduleResolution: "node",
      esModuleInterop: true,
      resolveJsonModule: true,
      strict: true,
      include: ["src/**/*.ts"],
    }),
    resolve({ preferBuiltins: true }),
    commonjs(),
    json(),
    terser(),
    {
      name: "package",
      writeBundle() {
        // Hash the bundle and write it into schema.json
        const code = fs.readFileSync("dist/plugin.min.js", "utf-8")
        const hash = crypto.createHash("sha1").update(code).digest("hex")
        const schema = JSON.parse(fs.readFileSync("schema.json", "utf-8"))
        schema.hash = hash
        schema.version = pkg.version
        fs.writeFileSync("schema.json", JSON.stringify(schema, null, 2))

        // Create tar.gz package
        const files = ["dist/plugin.min.js", "schema.json", "package.json"]
        if (fs.existsSync("icon.svg")) {
          files.push("icon.svg")
        }
        const tarName = `dist/${pkg.name}-${pkg.version}.tar.gz`
        execSync(`tar -czf ${tarName} ${files.join(" ")}`)
        console.log(`\n  Packaged: ${tarName}\n`)
      },
    },
  ],
  external: ["fs", "path", "crypto"],
}
