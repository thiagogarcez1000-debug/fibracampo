import { CartaoPonto } from "../comp/CartaoPonto";
import type { RespPontos } from "../tipos";
import { ordenarPrioridade } from "../util";

export function Inicio({ dados, erro, doCache }: { dados: RespPontos | null; erro: string; doCache: boolean }) {
  if (!dados) return erro ? <div className="erro" role="alert">{erro}</div> : <div className="vazio">Carregando…</div>;
  const fora = ordenarPrioridade(dados.pontos.filter((p) => p.status === "OFFLINE"));
  const r = dados.resumo;
  return (
    <>
      <div className="resumo" aria-label="Resumo da rede">
        <div className="cx"><b>{r.total}</b><span>pontos</span></div>
        <div className="cx on"><b>{r.online}</b><span>online</span></div>
        <div className="cx off"><b>{r.offline}</b><span>fora do ar</span></div>
      </div>
      <div className="meta">
        Última varredura: {r.ultima_varredura || "—"}{doCache ? " · mostrando a última lista salva no aparelho" : ""}
      </div>
      {dados.alertas.map((a) => (
        <div className="alerta" key={a.tipo + a.nome} role="status">
          ⚠ <b>{a.fora}{a.total ? " de " + a.total : ""} pontos fora em {a.nome}</b>: provável falha em trecho comum da fibra
          {a.tipo === "PON" ? " (antes da divisão para as CTOs)." : " (na CTO ou no cabo que chega nela)."}
        </div>
      ))}
      <h2 style={{ margin: "6px 0 0", fontSize: 18 }}>Fora do ar ({fora.length})</h2>
      {fora.length ? (
        <div className="lista">{fora.map((p) => <CartaoPonto key={p.chave} p={p} />)}</div>
      ) : (
        <div className="vazio">✅ Nenhum ponto fora do ar agora.</div>
      )}
    </>
  );
}
