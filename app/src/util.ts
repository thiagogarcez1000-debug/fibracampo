// Regras do app que não dependem de tela (testadas em testes/util.test.ts)
import type { Ponto } from "./tipos";

/** "há 2 h 05 min" / "há 12 min" / "agora" */
export function tempoFora(min: number | null | undefined): string {
  if (min === null || min === undefined) return "";
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  if (min < 60 * 24) return `há ${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} min`;
  const d = Math.floor(min / 1440);
  return `há ${d} dia${d > 1 ? "s" : ""} e ${Math.floor((min % 1440) / 60)} h`;
}

/** Tira acento e caixa para a busca achar "camera" em "Câmera". */
export function normalizar(s: string): string {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export interface Filtro { texto: string; olt: string; base: string; soFora: boolean }
export const FILTRO_VAZIO: Filtro = { texto: "", olt: "", base: "", soFora: false };

export function filtrar(pontos: Ponto[], f: Filtro): Ponto[] {
  const t = normalizar(f.texto);
  return pontos.filter((p) =>
    (!t || [p.nome, p.serial, p.ip, p.cto, p.endereco].some((c) => normalizar(c).includes(t))) &&
    (!f.olt || p.olt === f.olt) && (!f.base || p.base === f.base) && (!f.soFora || p.status === "OFFLINE"));
}

/** Fora do ar primeiro; dentro deles, críticos (SAMU, UPA...) e depois quem está há mais tempo fora. */
export function ordenarPrioridade(pontos: Ponto[]): Ponto[] {
  const peso = (p: Ponto) => (p.status === "OFFLINE" ? 0 : p.status === "ONLINE" ? 2 : 1);
  return [...pontos].sort((a, b) =>
    peso(a) - peso(b) || Number(b.critico) - Number(a.critico) || (b.parado_min ?? -1) - (a.parado_min ?? -1) ||
    a.nome.localeCompare(b.nome, "pt-BR"));
}

export const ROTULO_BASE: Record<string, string> = { ONU: "Unidade", CAMERA: "Câmera", WIFI: "Wi-Fi" };

export function linkComoChegar(lat: number, lon: number): string {
  // abre o app de navegação do celular (Google Maps / Waze escolhido pelo Android)
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
}

/** Converte lat/lon em pixel no mapa (projeção Web Mercator, a mesma dos tiles do OpenStreetMap). */
export function paraPixel(lat: number, lon: number, zoom: number): [number, number] {
  const n = 256 * 2 ** zoom;
  const x = ((lon + 180) / 360) * n;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
  return [x, y];
}

/** Maior zoom em que todos os pontos cabem na caixa (largura x altura). */
export function zoomQueCabe(coords: [number, number][], larg: number, alt: number, max = 17): number {
  for (let z = max; z > 3; z--) {
    const px = coords.map(([la, lo]) => paraPixel(la, lo, z));
    const xs = px.map((p) => p[0]), ys = px.map((p) => p[1]);
    if (Math.max(...xs) - Math.min(...xs) < larg - 40 && Math.max(...ys) - Math.min(...ys) < alt - 40) return z;
  }
  return 4;
}
