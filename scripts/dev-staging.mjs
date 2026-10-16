#!/usr/bin/env node
// Ejecuta Next.js apuntando al entorno de staging (variables de .env.staging), sin tocar
// .env.local ni producción.
//
//   npm run dev:staging      servidor de desarrollo en el puerto 3100
//   npm run build:staging    compila la aplicación (valida tipos y lint) con las variables de staging
//   npm run start:staging    sirve la compilación en el puerto 3100 (como en producción, sin recarga en caliente)
//
// También: node scripts/dev-staging.mjs [dev|build|start] [archivo.env]
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const COMMANDS = ["dev", "build", "start"];
const args = process.argv.slice(2);
const command = COMMANDS.includes(args[0]) ? args.shift() : "dev";
const file = path.resolve(args[0] ?? ".env.staging");
if (!fs.existsSync(file)) {
  console.error(`No existe ${file}. Crea el archivo a partir de .env.example (ver docs/ENTORNOS.md).`);
  process.exit(1);
}

const env = { ...process.env };
for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const port = process.env.PORT ?? "3100";
console.log(`Staging (${command}): proyecto ${env.NEXT_PUBLIC_FB_PROJECT_ID}${command === "build" ? "" : ` en http://localhost:${port}`}`);

const next = path.resolve("node_modules/next/dist/bin/next");
const nextArgs = command === "build" ? ["build"] : [command, "-p", port];
const child = spawn(process.execPath, [next, ...nextArgs], { stdio: "inherit", env });
child.on("exit", (code) => process.exit(code ?? 0));
