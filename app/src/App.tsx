import { useEffect, useState } from "react";
import { quandoSessaoExpirar, sair, token } from "./api";
import { apagarTudo, ler } from "./armazenamento";
import { usePontos } from "./dados";
import { ir, useRota, voltar } from "./rotas";
import { Busca } from "./telas/Busca";
import { Detalhe } from "./telas/Detalhe";
import { Inicio } from "./telas/Inicio";
import { Login } from "./telas/Login";
import { Pendentes } from "./telas/Pendentes";
import { Registrar } from "./telas/Registrar";
import { fila, iniciarSincronia } from "./sincronia";
import { avisosLigados, iniciarAvisos, pedirPermissao, suportaAvisos, textoEvento } from "./avisos";
import { aoMudarInstalacao, instalar, jaInstalado, podeInstalar } from "./instalar";
import { Historico } from "./telas/Historico";

const ABAS = [
  { tela: "inicio", ic: "🏠", txt: "Início" },
  { tela: "busca", ic: "🔎", txt: "Buscar" },
  { tela: "pendentes", ic: "📤", txt: "Envios" },
  { tela: "conta", ic: "👤", txt: "Conta" },
];

function useOnline() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false);
    addEventListener("online", a); addEventListener("offline", b);
    return () => { removeEventListener("online", a); removeEventListener("offline", b); };
  }, []);
  return on;
}

export function App() {
  const [logado, setLogado] = useState(!!token());
  useEffect(() => quandoSessaoExpirar(() => setLogado(false)), []);
  if (!logado) return <Login aoEntrar={() => { setLogado(true); ir("inicio"); }} />;
  return <Logado aoSair={() => setLogado(false)} />;
}

function Logado({ aoSair }: { aoSair: () => void }) {
  const rota = useRota();
  const online = useOnline();
  const { dados, erro, carregando, doCache, atualizar } = usePontos();
  const fora = dados?.resumo.offline ?? 0;
  const [pend, setPend] = useState(0);
  const [toast, setToast] = useState("");
  const [testes, setTestes] = useState<Record<string, string>>({});

  useEffect(() => fila.ouvir(setPend), []);
  const [avisos, setAvisos] = useState(avisosLigados());
  const [instalavel, setInstalavel] = useState(podeInstalar());
  useEffect(() => aoMudarInstalacao(setInstalavel), []);
  useEffect(() => iniciarAvisos((e) => { mostrar(textoEvento(e).titulo); atualizar(); }), []);
  useEffect(() => iniciarSincronia((n) => mostrar(`✔ ${n} atendimento(s) pendente(s) enviado(s).`)), []);
  useEffect(() => {
    const t = sessionStorage.getItem("fibracampo.toast");
    if (t) { sessionStorage.removeItem("fibracampo.toast"); mostrar(t); }
  }, [rota.tela, rota.arg]);
  function mostrar(t: string) { setToast(t); setTimeout(() => setToast(""), 4500); }

  async function sairDaConta() {
    await sair();
    apagarTudo();             // segurança: sair apaga token e dados locais (aparelho pode ser pessoal)
    aoSair();
  }

  let titulo = "FibraCampo", corpo: React.ReactNode, interna = false;
  switch (rota.tela) {
    case "ponto":
      titulo = "Detalhe do ponto"; interna = true;
      corpo = <Detalhe chave={rota.arg} dados={dados} aoTestar={(r) => setTestes({ ...testes, [rota.arg]: r })} />;
      break;
    case "registrar":
      titulo = "Registrar atendimento"; interna = true;
      corpo = <Registrar chave={rota.arg} dados={dados} statusTeste={testes[rota.arg] || ""} />;
      break;
    case "historico":
      titulo = "Histórico do ponto"; interna = true;
      corpo = <Historico chave={rota.arg} nome={dados?.pontos.find((p) => p.chave === rota.arg)?.nome} />;
      break;
    case "pendentes":
      titulo = "Envios pendentes";
      corpo = <Pendentes />;
      break;
    case "busca":
      titulo = "Buscar ponto";
      corpo = <Busca dados={dados} />;
      break;
    case "conta":
      titulo = "Conta";
      corpo = (
        <div className="acoes">
          <div className="ficha"><dl><dt>Usuário</dt><dd>{ler("usuario", "")}</dd><dt>Perfil</dt><dd>{ler("perfil", "")}</dd></dl></div>
          {suportaAvisos() && (
            <button className={"bt " + (avisos ? "cinza" : "verde")} onClick={async () => {
              if (avisos) { localStorage.setItem("fibracampo.avisos", "false"); setAvisos(false); }
              else setAvisos(await pedirPermissao());
            }}>{avisos ? "🔕 Desligar avisos de pontos críticos" : "🔔 Ligar avisos de pontos críticos"}</button>
          )}
          <div className="meta">Avisa no celular quando SAMU, UPA, hospitais e outros pontos críticos caem ou voltam.</div>
          {instalavel && !jaInstalado() && <button className="bt" onClick={() => instalar()}>📲 Instalar o FibraCampo no celular</button>}
          {jaInstalado() && <div className="ok">✔ App instalado neste aparelho.</div>}
          <button className="bt laranja" onClick={sairDaConta}>Sair e apagar dados do aparelho</button>
          <div className="meta">Versão {typeof __VERSAO__ !== "undefined" ? __VERSAO__ : "dev"}</div>
        </div>
      );
      break;
    default:
      corpo = <Inicio dados={dados} erro={erro} doCache={doCache} />;
  }

  return (
    <div className="app">
      <header className="topo">
        {interna && <button className="voltar" onClick={voltar} aria-label="Voltar">←</button>}
        <h1>{titulo}{!interna && <span className="sub">Rede óptica · Prefeitura de Anápolis</span>}</h1>
        {!interna && (
          <button className="bt cinza" style={{ width: "auto", minHeight: 44 }} onClick={atualizar} disabled={carregando} aria-label="Atualizar lista">
            {carregando ? "…" : "↻"}
          </button>
        )}
      </header>
      {!online && <div className="faixa off" role="status">📵 Sem internet: mostrando dados salvos no aparelho.</div>}
      {pend > 0 && rota.tela !== "pendentes" && (
        <button className="faixa fila" style={{ border: 0, width: "100%" }} onClick={() => ir("pendentes")}>
          📤 {pend} atendimento(s) aguardando envio — toque para ver
        </button>
      )}
      <main className="conteudo">{corpo}</main>
      <nav className="nav" aria-label="Menu principal" style={{ gridTemplateColumns: `repeat(${ABAS.length},1fr)` }}>
        {ABAS.map((a) => (
          <button key={a.tela} className={rota.tela === a.tela || (a.tela === "inicio" && !ABAS.some((x) => x.tela === rota.tela)) ? "ativo" : ""}
            onClick={() => ir(a.tela)} aria-current={rota.tela === a.tela ? "page" : undefined}>
            <span className="ic" aria-hidden="true">{a.ic}</span>{a.txt}
            {a.tela === "inicio" && fora > 0 && <span className="bolha">{fora}</span>}
            {a.tela === "pendentes" && pend > 0 && <span className="bolha" style={{ background: "#2563eb" }}>{pend}</span>}
          </button>
        ))}
      </nav>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

declare const __VERSAO__: string;
