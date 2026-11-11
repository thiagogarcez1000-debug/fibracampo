// Mapa leve: tiles do OpenStreetMap + rota da fibra desenhada em SVG (sem biblioteca externa, ~3 KB).
import { useEffect, useRef, useState } from "react";
import { paraPixel, zoomQueCabe } from "../util";

interface Props { alvo: [number, number]; rota?: [number, number][]; olt?: [number, number] | null }

export function Mapa({ alvo, rota = [], olt }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const [tam, setTam] = useState<[number, number]>([360, 260]);
  const todos = rota.length ? rota : [alvo];
  const [zoom, setZoom] = useState(() => zoomQueCabe(todos, 360, 260));
  const [desloc, setDesloc] = useState<[number, number]>([0, 0]);
  const arrasto = useRef<[number, number] | null>(null);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const ajustar = () => setTam([el.clientWidth, el.clientHeight]);
    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { setZoom(zoomQueCabe(todos, tam[0], tam[1])); setDesloc([0, 0]); }, [tam[0], tam[1], alvo[0], alvo[1], rota.length]);

  // centro = meio da rota (ou o ponto)
  const px = todos.map(([la, lo]) => paraPixel(la, lo, zoom));
  const cx = (Math.min(...px.map((p) => p[0])) + Math.max(...px.map((p) => p[0]))) / 2 - desloc[0];
  const cy = (Math.min(...px.map((p) => p[1])) + Math.max(...px.map((p) => p[1]))) / 2 - desloc[1];
  const x0 = cx - tam[0] / 2, y0 = cy - tam[1] / 2;
  const tiles: { x: number; y: number }[] = [];
  for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x0 + tam[0]) / 256); tx++)
    for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y0 + tam[1]) / 256); ty++) tiles.push({ x: tx, y: ty });
  const tela = (la: number, lo: number) => { const [x, y] = paraPixel(la, lo, zoom); return [x - x0, y - y0]; };
  const [ax, ay] = tela(alvo[0], alvo[1]);
  const linha = rota.map(([la, lo]) => tela(la, lo).join(",")).join(" ");
  const oltPx = olt ? tela(olt[0], olt[1]) : null;
  const max = 2 ** zoom;

  return (
    <div className="mapa" ref={caixa} role="img" aria-label="Mapa do ponto com a rota da fibra até a OLT"
      onPointerDown={(e) => { arrasto.current = [e.clientX, e.clientY]; (e.target as Element).setPointerCapture?.(e.pointerId); }}
      onPointerMove={(e) => {
        if (!arrasto.current) return;
        const [sx, sy] = arrasto.current;
        arrasto.current = [e.clientX, e.clientY];
        setDesloc(([dx, dy]) => [dx + e.clientX - sx, dy + e.clientY - sy]);
      }}
      onPointerUp={() => { arrasto.current = null; }}>
      {tiles.map(({ x, y }) => (
        <img key={`${zoom}/${x}/${y}`} alt="" draggable={false} loading="lazy"
          src={`https://tile.openstreetmap.org/${zoom}/${((x % max) + max) % max}/${y}.png`}
          style={{ left: x * 256 - x0, top: y * 256 - y0 }} onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
      ))}
      <svg aria-hidden="true">
        {linha && <polyline points={linha} fill="none" stroke="#0ea5e9" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />}
        {linha && <polyline points={linha} fill="none" stroke="#e0f2fe" strokeWidth="1.5" strokeDasharray="6 6" />}
        {oltPx && <g><rect x={oltPx[0] - 9} y={oltPx[1] - 9} width="18" height="18" rx="3" fill="#2563eb" stroke="#fff" strokeWidth="2" />
          <text x={oltPx[0] + 13} y={oltPx[1] + 5} fill="#fff" fontSize="13" fontWeight="700" stroke="#0b1120" strokeWidth="3" paintOrder="stroke">OLT</text></g>}
        <circle cx={ax} cy={ay} r="11" fill="#dc2626" stroke="#fff" strokeWidth="3" />
      </svg>
      <div className="zoom">
        <button type="button" aria-label="Aproximar" onClick={() => { if (zoom < 18) { setZoom(zoom + 1); setDesloc(([dx, dy]) => [dx * 2, dy * 2]); } }}>+</button>
        <button type="button" aria-label="Afastar" onClick={() => { if (zoom > 4) { setZoom(zoom - 1); setDesloc(([dx, dy]) => [dx / 2, dy / 2]); } }}>−</button>
      </div>
      <span className="credito">© OpenStreetMap</span>
    </div>
  );
}
