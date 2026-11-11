// Botão "Instalar o app" (Android/Chrome). No APK gerado pelo PWABuilder este botão não aparece.
let evento: any = null;
const ouvintes = new Set<(pode: boolean) => void>();
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); evento = e; ouvintes.forEach((f) => f(true)); });
addEventListener("appinstalled", () => { evento = null; ouvintes.forEach((f) => f(false)); });

export function podeInstalar(): boolean { return !!evento; }
export function aoMudarInstalacao(f: (pode: boolean) => void): () => void { ouvintes.add(f); return () => { ouvintes.delete(f); }; }
export async function instalar(): Promise<boolean> {
  if (!evento) return false;
  evento.prompt();
  const r = await evento.userChoice;
  evento = null;
  return r?.outcome === "accepted";
}
export function jaInstalado(): boolean {
  return matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}
