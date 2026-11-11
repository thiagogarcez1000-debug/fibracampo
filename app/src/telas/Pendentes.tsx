import { useEffect, useState } from "react";
import type { ItemFila } from "../fila";
import { fila } from "../sincronia";

export function Pendentes() {
  const [itens, setItens] = useState<ItemFila[]>([]);
  const [msg, setMsg] = useState("");
  const recarregar = () => fila.pendentes().then(setItens);
  useEffect(() => { recarregar(); return fila.ouvir(() => recarregar()); }, []);

  async function enviar() {
    setMsg("Enviando…");
    const n = await fila.sincronizar();
    setMsg(n ? `✔ ${n} atendimento(s) enviado(s).` : navigator.onLine ? "Nada foi enviado. Veja o erro em cada item." : "Ainda sem sinal.");
  }

  if (!itens.length) return <div className="vazio">✅ Nenhum atendimento esperando envio.</div>;
  return (
    <>
      <div className="meta">Estes atendimentos estão salvos só no aparelho. Eles são enviados sozinhos quando a conexão volta.</div>
      <button className="bt" onClick={enviar}>⬆ Enviar agora</button>
      {msg && <div className="meta" role="status">{msg}</div>}
      {itens.map((a) => (
        <div className="atend" key={a.uuid}>
          <span className="pend">AGUARDANDO ENVIO</span>
          <span className="c">{a.ponto}</span>
          <span>{a.causa}{a.acao ? " — " + a.acao : ""}</span>
          <span className="q">{new Date(a.criado_em * 1000).toLocaleString("pt-BR")} · {a.fotos_b64.length} foto(s){a.lat !== null ? " · com GPS" : ""}</span>
          {a.ultimoErro && <span className="erro" style={{ fontSize: 13 }}>Última tentativa: {a.ultimoErro}</span>}
        </div>
      ))}
    </>
  );
}
