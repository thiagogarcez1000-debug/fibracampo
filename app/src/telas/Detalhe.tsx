import { useEffect, useState } from "react";
import { api } from "../api";
import { Selo } from "../comp/CartaoPonto";
import { Mapa } from "../comp/Mapa";
import { TestarAgora } from "../comp/TestarAgora";
import { ir } from "../rotas";
import type { Ponto, RespPontos, Rota } from "../tipos";
import { linkComoChegar, ROTULO_BASE, tempoFora } from "../util";

export function Detalhe({ chave, dados, aoTestar }: { chave: string; dados: RespPontos | null; aoTestar: (r: string) => void }) {
  const doCache = dados?.pontos.find((p) => p.chave === chave) || null;
  const [ponto, setPonto] = useState<Ponto | null>(doCache);
  const [rota, setRota] = useState<Rota | null>(null);
  const [erro, setErro] = useState("");
  const [teste, setTeste] = useState("");      // resultado do "testar agora" vale mais que a varredura antiga

  useEffect(() => {
    api.ponto(chave).then((r) => { setPonto(r.ponto); setRota(r.rota); setErro(""); })
      .catch((e) => setErro(doCache ? "Sem conexão: mostrando os dados salvos. O mapa da rota precisa de sinal." : e.message));
  }, [chave]);

  if (!ponto) return erro ? <div className="erro" role="alert">{erro}</div> : <div className="vazio">Carregando…</div>;
  const temLocal = ponto.lat !== null && ponto.lon !== null;
  const coords = rota?.coords?.length ? rota.coords : [];
  return (
    <>
      <div className="cab-ponto">
        <h2>{ponto.nome}</h2>
        <div><Selo status={teste || ponto.status} />{ponto.critico && <span className="selo crit">CRÍTICO</span>}</div>
        {teste === "ONLINE" && ponto.status === "OFFLINE" && <div className="ok">Voltou a responder no teste agora (a lista atualiza na próxima varredura).</div>}
        {!teste && ponto.status === "OFFLINE" && ponto.parado_min !== null && <div className="tempo">Fora do ar {tempoFora(ponto.parado_min)}</div>}
      </div>
      {erro && <div className="meta">{erro}</div>}
      <div className="acoes">
        <TestarAgora chave={chave} aoResultado={(r) => { setTeste(r); aoTestar(r); }} />
        <div className="acoes duas">
          <button className="bt" onClick={() => ir("registrar", chave)}>📝 Registrar</button>
          <button className="bt cinza" onClick={() => ir("historico", chave)}>🗂 Histórico</button>
        </div>
      </div>
      <div className="ficha">
        <dl>
          <dt>Tipo</dt><dd>{ROTULO_BASE[ponto.base] || ponto.base}</dd>
          <dt>OLT / PON</dt><dd>{ponto.olt}{ponto.gpon ? " · PON " + ponto.gpon : ""}</dd>
          <dt>CTO</dt><dd>{ponto.cto || "—"}</dd>
          <dt>Serial</dt><dd>{ponto.serial || "—"}</dd>
          <dt>IP</dt><dd>{ponto.ip || "—"}</dd>
          <dt>Endereço</dt><dd>{ponto.endereco || "—"}</dd>
        </dl>
      </div>
      {temLocal ? (
        <>
          <Mapa alvo={[ponto.lat!, ponto.lon!]} rota={coords} olt={coords.length ? coords[coords.length - 1] : null} />
          {rota && (
            <div className="meta">
              Rota até a {rota.olt}{rota.metros ? ` · cerca de ${(rota.metros / 1000).toFixed(1).replace(".", ",")} km de fibra` : ""}
              {rota.passos?.length ? <ol className="passos">{rota.passos.map((s, i) => <li key={i}>{s.n} {s.k === "cabo" && s.m ? `(${s.m} m)` : `(${s.t})`}</li>)}</ol> : null}
            </div>
          )}
          <a className="bt" href={linkComoChegar(ponto.lat!, ponto.lon!)} target="_blank" rel="noopener">🧭 Como chegar</a>
        </>
      ) : (
        <div className="meta">Este ponto ainda não tem localização cadastrada.</div>
      )}
    </>
  );
}
