import { useEffect, useState } from "react";
import { api, token, servidor } from "../api";
import type { Atendimento } from "../tipos";

function Foto({ nome }: { nome: string }) {
  // a foto exige o token: baixa com o cabeçalho e mostra a partir da memória
  const [src, setSrc] = useState("");
  useEffect(() => {
    let url = "";
    fetch(servidor() + "/api/m/foto?f=" + encodeURIComponent(nome), { headers: { Authorization: "Bearer " + token() } })
      .then((r) => (r.ok ? r.blob() : Promise.reject())).then((b) => { url = URL.createObjectURL(b); setSrc(url); }).catch(() => {});
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [nome]);
  return <div className="mini">{src ? <img src={src} alt="Foto do atendimento" /> : null}</div>;
}

export function Historico({ chave, nome }: { chave: string; nome?: string }) {
  const [lista, setLista] = useState<Atendimento[] | null>(null);
  const [erro, setErro] = useState("");
  useEffect(() => { api.atendimentos(chave).then((r) => setLista(r.atendimentos)).catch((e) => setErro(e.message)); }, [chave]);

  if (erro) return <div className="erro" role="alert">{erro}</div>;
  if (!lista) return <div className="vazio">Carregando…</div>;
  return (
    <>
      {nome && <h2 style={{ margin: 0, fontSize: 20 }}>{nome}</h2>}
      <div className="meta">{lista.length} atendimento(s) registrado(s) pelo app</div>
      {!lista.length && <div className="vazio">Nenhum atendimento registrado ainda para este ponto.</div>}
      {lista.map((a) => (
        <div className="atend" key={a.uuid}>
          <span className="q">{new Date(a.criado_em * 1000).toLocaleString("pt-BR")} · {a.tecnico}{a.offline ? " · registrado sem sinal" : ""}</span>
          <span className="c">{a.causa}</span>
          {a.acao && <span>{a.acao}</span>}
          {a.obs && <span className="meta">{a.obs}</span>}
          {a.fotos?.length ? <div className="fotos">{a.fotos.map((f) => <Foto key={f} nome={f} />)}</div> : null}
          {a.lat !== null && a.lon !== null && (
            <a className="meta" href={`https://www.google.com/maps?q=${a.lat},${a.lon}`} target="_blank" rel="noopener">📍 Local do registro</a>
          )}
        </div>
      ))}
    </>
  );
}
