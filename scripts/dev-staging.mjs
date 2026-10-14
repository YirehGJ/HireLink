#!/usr/bin/env node
// Levanta `next dev` apuntando al entorno de staging (variables de .env.staging), sin tocar
// .env.local ni producción. Uso: npm run dev:staging   (puerto 3100)
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const file = path.resolve(process.argv[2] ?? ".env.staging");
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
console.log(`Staging: proyecto ${env.NEXT_PUBLIC_FB_PROJECT_ID} en http://localhost:${port}`);

const next = path.resolve("node_modules/next/dist/bin/next");
const child = spawn(process.execPath, [next, "dev", "-p", port], { stdio: "inherit", env });
child.on("exit", (code) => process.exit(code ?? 0));
