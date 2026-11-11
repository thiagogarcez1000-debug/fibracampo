import { ir } from "../rotas";
import type { Ponto } from "../tipos";
import { ROTULO_BASE, tempoFora } from "../util";

const TXT: Record<string, string> = { ONLINE: "ONLINE", OFFLINE: "FORA DO AR", PENDENTE: "SEM TESTE", SEM_RESPOSTA: "SEM RESPOSTA" };

export function Selo({ status }: { status: string }) {
  return <span className={"selo " + status}>{TXT[status] || status}</span>;
}

export function CartaoPonto({ p }: { p: Ponto }) {
  return (
    <button className={"ponto " + p.status} onClick={() => ir("ponto", p.chave)}
      aria-label={`${p.nome}, ${TXT[p.status] || p.status}${p.parado_min !== null ? ", " + tempoFora(p.parado_min) : ""}`}>
      <span className="barra" aria-hidden="true" />
      <span className="meio">
        <span className="nm">{p.nome}{p.critico && <span className="selo crit">CRÍTICO</span>}</span>
        <span className="inf" style={{ display: "block" }}>
          {ROTULO_BASE[p.base] || p.base} · {p.olt}{p.gpon ? " · PON " + p.gpon : ""}{p.cto ? " · " + p.cto : ""}
        </span>
      </span>
      <span className="lado">
        <Selo status={p.status} />
        {p.status === "OFFLINE" && p.parado_min !== null && <span className="tempo">{tempoFora(p.parado_min)}</span>}
      </span>
    </button>
  );
}
