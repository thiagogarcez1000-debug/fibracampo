import { useState } from "react";
import { definirServidor, entrar, servidor } from "../api";

export function Login({ aoEntrar }: { aoEntrar: () => void }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [url, setUrl] = useState(servidor());
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!usuario.trim() || !senha) { setErro("Informe usuário e senha."); return; }
    setEnviando(true);
    definirServidor(url);
    try {
      await entrar(usuario.trim().toLowerCase(), senha);
      setSenha("");
      aoEntrar();
    } catch (x: any) {
      setErro(x.message || "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="login" onSubmit={enviar} aria-label="Entrar no FibraCampo">
      <div className="marca">
        <img src="icons/icone-192.png" alt="" />
        <h1>FibraCampo</h1>
        <p>Rede óptica · Prefeitura de Anápolis</p>
      </div>
      <label>Usuário
        <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoCapitalize="none" autoComplete="username" inputMode="text" />
      </label>
      <label>Senha
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
      </label>
      {erro && <div className="erro" role="alert">{erro}</div>}
      <button className="bt" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
      <details className="avancado">
        <summary>Endereço do servidor (avançado)</summary>
        <label>Servidor
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="vazio = este mesmo endereço" inputMode="url" autoCapitalize="none" />
        </label>
        <p className="meta" style={{ textAlign: "left" }}>Só preencha se o app foi instalado de outro endereço. O acesso de fora da Prefeitura é pela VPN.</p>
      </details>
    </form>
  );
}
