// Cliente da API do FibraCampo. O celular só conversa com a API (nunca com OLT/ONU).
import { ler, gravar } from "./armazenamento";
import type { Atendimento, Evento, Ponto, RespPontos, Rota } from "./tipos";

export class ErroApi extends Error {
  constructor(msg: string, public status = 0) { super(msg); }
}

/** Endereço do servidor. Vazio = o mesmo endereço de onde o app foi aberto (servidor do NOC em /app/). */
export function servidor(): string { return ler<string>("servidor", ""); }
export function definirServidor(url: string): void { gravar("servidor", url.trim().replace(/\/+$/, "")); }
export function token(): string { return ler<string>("token", ""); }

let aoExpirar: () => void = () => {};
export function quandoSessaoExpirar(fn: () => void): void { aoExpirar = fn; }

async function chamar<T>(caminho: string, opcoes: RequestInit = {}, tempoMs = 12000): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), tempoMs);
  let r: Response;
  try {
    r = await fetch(servidor() + caminho, {
      ...opcoes, signal: ctl.signal,
      headers: { "Content-Type": "application/json", ...(token() ? { Authorization: "Bearer " + token() } : {}), ...(opcoes.headers || {}) },
    });
  } catch {
    throw new ErroApi("Sem conexão com o servidor. Verifique o sinal e a VPN.", 0);
  } finally {
    clearTimeout(t);
  }
  let corpo: any = {};
  try { corpo = await r.json(); } catch { /* resposta vazia */ }
  if (r.status === 401 && caminho !== "/login") { aoExpirar(); throw new ErroApi("Sessão expirada. Entre novamente.", 401); }
  if (!r.ok) throw new ErroApi(corpo.erro || `O servidor respondeu ${r.status}.`, r.status);
  return corpo as T;
}

export async function entrar(usuario: string, senha: string): Promise<{ perfil: string }> {
  try {
    const r = await chamar<{ ok: boolean; perfil: string; token: string }>("/login", { method: "POST", body: JSON.stringify({ usuario, senha }) });
    if (!r.token) throw new ErroApi("O servidor não devolveu o token. Rode o instalar_api_mobile.py no servidor.");
    gravar("token", r.token);
    gravar("usuario", usuario);
    gravar("perfil", r.perfil);
    return r;
  } catch (e) {
    if (e instanceof ErroApi && e.status === 401) throw new ErroApi("Usuário ou senha incorretos.", 401);
    throw e;
  }
}

export async function sair(): Promise<void> {
  try { await chamar("/logout", { method: "POST" }, 4000); } catch { /* sem sinal: apaga do aparelho mesmo assim */ }
}

export const api = {
  pontos: () => chamar<RespPontos>("/api/m/pontos"),
  ponto: (chave: string) => chamar<{ ponto: Ponto; rota: Rota | null }>("/api/m/ponto?chave=" + encodeURIComponent(chave)),
  testar: (chave: string) =>
    chamar<{ ok: boolean; resultado: "ONLINE" | "OFFLINE" | "SEM_RESPOSTA"; ms?: number; quando?: string; erro?: string }>(
      "/api/m/testar", { method: "POST", body: JSON.stringify({ chave }) }, 20000),
  enviarAtendimento: (a: Atendimento & { fotos_b64: string[] }) =>
    chamar<{ ok: boolean; uuid: string; duplicado?: boolean }>("/api/m/atendimento", {
      method: "POST", body: JSON.stringify({ ...a, fotos: a.fotos_b64 }),
    }, 30000),
  atendimentos: (chave: string) => chamar<{ atendimentos: Atendimento[] }>("/api/m/atendimentos?chave=" + encodeURIComponent(chave)),
  eventos: (desde: number) => chamar<{ eventos: Evento[]; agora: number }>("/api/m/eventos?desde=" + desde),
  urlFoto: (nome: string) => servidor() + "/api/m/foto?f=" + encodeURIComponent(nome),
};
