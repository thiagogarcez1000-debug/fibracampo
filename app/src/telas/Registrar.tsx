import { useEffect, useRef, useState } from "react";
import { comprimirFoto, pegarGPS } from "../fotos";
import { novoUuid } from "../fila";
import { fila } from "../sincronia";
import { voltar } from "../rotas";
import type { RespPontos } from "../tipos";

const CAUSAS = ["Rompimento de fibra", "Conector sujo/danificado", "ONU queimada/trocada", "Falta de energia no local",
  "Fonte/cabo de energia da ONU", "Equipamento desligado pelo usuário", "Problema na CTO", "Atenuação alta", "Outra"];
const MAX_FOTOS = 3;

export function Registrar({ chave, dados, statusTeste }: { chave: string; dados: RespPontos | null; statusTeste: string }) {
  const ponto = dados?.pontos.find((p) => p.chave === chave);
  const [causa, setCausa] = useState("");
  const [acao, setAcao] = useState("");
  const [obs, setObs] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [gps, setGps] = useState<{ lat: number; lon: number; precisao: number } | null>(null);
  const [msgGps, setMsgGps] = useState("Obtendo localização…");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const cam = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pegarGPS().then((g) => { setGps(g); setMsgGps(""); }).catch((e) => setMsgGps(e.message));
  }, []);

  async function addFotos(lista: FileList | null) {
    if (!lista) return;
    setErro("");
    try {
      const novas: string[] = [];
      for (const f of Array.from(lista).slice(0, MAX_FOTOS - fotos.length)) novas.push(await comprimirFoto(f));
      setFotos((x) => [...x, ...novas].slice(0, MAX_FOTOS));
    } catch (e: any) {
      setErro(e.message);
    }
  }

  async function salvar() {
    if (!causa) { setErro("Escolha a causa."); return; }
    setSalvando(true);
    const offline = !navigator.onLine;
    await fila.adicionar({
      uuid: novoUuid(), chave, ponto: ponto?.nome || chave, causa, acao: acao.trim(), obs: obs.trim(),
      lat: gps?.lat ?? null, lon: gps?.lon ?? null, fotos: [], criado_em: Date.now() / 1000, offline,
      status_no_registro: statusTeste || ponto?.status || "",
    }, fotos);
    const enviados = offline ? 0 : await fila.sincronizar();
    sessionStorage.setItem("fibracampo.toast", enviados ? "✔ Atendimento enviado." : "💾 Sem sinal: atendimento salvo no aparelho. Será enviado quando a conexão voltar.");
    voltar();                // volta para o detalhe do ponto
  }

  return (
    <>
      <h2 style={{ margin: 0, fontSize: 20 }}>{ponto?.nome || chave}</h2>
      {statusTeste && <div className="meta">Último teste: {statusTeste === "ONLINE" ? "respondendo ✔" : statusTeste}</div>}
      <label>Causa *
        <select value={causa} onChange={(e) => setCausa(e.target.value)} required>
          <option value="">Escolha…</option>
          {CAUSAS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label>O que foi feito
        <input value={acao} onChange={(e) => setAcao(e.target.value)} placeholder="Ex.: emenda no poste novo" maxLength={300} />
      </label>
      <label>Observação
        <textarea value={obs} onChange={(e) => setObs(e.target.value)} maxLength={1000} placeholder="Material usado, metragem, quem acompanhou…" />
      </label>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Fotos ({fotos.length}/{MAX_FOTOS})</div>
        <div className="fotos">
          {fotos.map((f, i) => (
            <div className="mini" key={i}><img src={f} alt={`Foto ${i + 1}`} />
              <button aria-label={`Remover foto ${i + 1}`} onClick={() => setFotos(fotos.filter((_, j) => j !== i))}>✕</button></div>
          ))}
        </div>
        {fotos.length < MAX_FOTOS && (
          <button className="bt contorno" style={{ marginTop: 8 }} onClick={() => cam.current?.click()}>📷 Tirar foto</button>
        )}
        <input ref={cam} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => { addFotos(e.target.files); e.target.value = ""; }} />
      </div>
      <div className="gps" role="status">
        📍 {gps ? `Localização registrada (precisão de ${gps.precisao} m)` : msgGps}
      </div>
      {!navigator.onLine && <div className="faixa fila" style={{ borderRadius: 10 }}>Sem sinal: o registro fica salvo no aparelho e é enviado sozinho depois.</div>}
      {erro && <div className="erro" role="alert">{erro}</div>}
      <button className="bt verde" onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "✔ Salvar atendimento"}</button>
    </>
  );
}
