// Gera a pasta dist/ (é ela que vai para o servidor, na pasta app_mobile do Gerenciador)
import * as esbuild from "esbuild";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const versao = JSON.parse(readFileSync("package.json", "utf8")).version;
mkdirSync("dist", { recursive: true });
cpSync("public", "dist", { recursive: true });
// o service worker leva a versão no nome do cache: cada build novo atualiza o app no celular
writeFileSync("dist/sw.js", readFileSync("public/sw.js", "utf8").replaceAll("__VERSAO__", versao + "-" + Date.now()));

const opcoes = {
  entryPoints: ["src/main.tsx"], bundle: true, minify: true, sourcemap: false,
  outfile: "dist/app.js", target: "es2019", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"', __VERSAO__: JSON.stringify(versao) },
  logLevel: "info",
};
if (process.argv.includes("--watch")) {
  const ctx = await esbuild.context(opcoes);
  await ctx.watch();
} else {
  await esbuild.build(opcoes);
}
