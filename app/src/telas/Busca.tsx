import { useMemo, useState } from "react";
import { CartaoPonto } from "../comp/CartaoPonto";
import { ler, gravar } from "../armazenamento";
import type { RespPontos } from "../tipos";
import { FILTRO_VAZIO, filtrar, ordenarPrioridade, ROTULO_BASE, type Filtro } from "../util";

export function Busca({ dados }: { dados: RespPontos | null }) {
  const [f, setF] = useState<Filtro>(() => ({ ...FILTRO_VAZIO, ...ler<Partial<Filtro>>("filtro", {}), texto: "" }));
  const muda = (x: Partial<Filtro>) => { const n = { ...f, ...x }; setF(n); gravar("filtro", { ...n, texto: "" }); };
  const pontos = dados?.pontos || [];
  const olts = useMemo(() => [...new Set(pontos.map((p) => p.olt).filter(Boolean))].sort(), [pontos]);
  const res = useMemo(() => ordenarPrioridade(filtrar(pontos, f)), [pontos, f]);

  return (
    <>
      <div className="busca">
        <input type="search" placeholder="Nome, serial, IP ou CTO" value={f.texto} autoFocus
          onChange={(e) => setF({ ...f, texto: e.target.value })} aria-label="Buscar ponto" enterKeyHint="search" />
      </div>
      <div className="chips" role="group" aria-label="Tipo">
        {["", "ONU", "CAMERA", "WIFI"].map((b) => (
          <button key={b} className={"chip" + (f.base === b ? " ativo" : "")} onClick={() => muda({ base: b })} aria-pressed={f.base === b}>
            {b ? ROTULO_BASE[b] : "Todos"}
          </button>
        ))}
        <button className={"chip" + (f.soFora ? " ativo" : "")} onClick={() => muda({ soFora: !f.soFora })} aria-pressed={f.soFora}>Só fora do ar</button>
      </div>
      <label>OLT
        <select value={f.olt} onChange={(e) => muda({ olt: e.target.value })}>
          <option value="">Todas as OLTs</option>
          {olts.map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
      <div className="meta" aria-live="polite">{res.length} ponto(s)</div>
      <div className="lista">{res.slice(0, 150).map((p) => <CartaoPonto key={p.chave} p={p} />)}</div>
      {res.length > 150 && <div className="meta">Mostrando 150. Refine a busca para ver os demais.</div>}
    </>
  );
}
