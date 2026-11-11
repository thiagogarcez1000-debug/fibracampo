import { useState } from "react";
import { api } from "../api";

const TXT = { ONLINE: "✔ O ponto está respondendo", OFFLINE: "✖ O ponto continua sem responder", SEM_RESPOSTA: "? Não foi possível confirmar" };

export function TestarAgora({ chave, aoResultado }: { chave: string; aoResultado: (r: string) => void }) {
  const [estado, setEstado] = useState<"" | "testando">("");
  const [res, setRes] = useState<{ resultado: keyof typeof TXT; ms?: number; quando?: string } | null>(null);
  const [erro, setErro] = useState("");

  async function testar() {
    setEstado("testando"); setErro(""); setRes(null);
    try {
      const r = await api.testar(chave);
      setRes(r); aoResultado(r.resultado);
      navigator.vibrate?.(r.resultado === "ONLINE" ? 80 : [60, 60, 60]);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setEstado("");
    }
  }

  return (
    <>
      <button className="bt verde" onClick={testar} disabled={estado === "testando"}>
        {estado === "testando" ? "⏳ Testando o ponto…" : "📡 Testar agora"}
      </button>
      {res && (
        <div className={"resultado " + res.resultado} role="status" aria-live="assertive">
          {TXT[res.resultado]}
          <div className="meta" style={{ color: "inherit", fontWeight: 500 }}>{res.quando}{res.ms !== undefined ? ` · ${res.ms} ms` : ""}</div>
        </div>
      )}
      {erro && <div className="erro" role="alert">{erro}</div>}
    </>
  );
}
