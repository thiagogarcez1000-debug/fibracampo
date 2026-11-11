// Formatos de dados trocados com a API (api/api_mobile.py)
export type Status = "ONLINE" | "OFFLINE" | "PENDENTE" | "SEM_RESPOSTA";

export interface Ponto {
  chave: string; base: string; nome: string; status: Status;
  olt: string; gpon: string; serial: string; ip: string; cto: string; tipo: string;
  endereco: string; lat: number | null; lon: number | null;
  parado_min: number | null; critico: boolean;
}
export interface ResumoBase { rotulo: string; total: number; online: number; offline: number }
export interface Resumo {
  bases: Record<string, ResumoBase>; total: number; online: number; offline: number;
  ultima_varredura: string; em_varredura: boolean;
}
export interface AlertaGrupo { tipo: "PON" | "CTO"; nome: string; fora: number; total: number | null }
export interface RespPontos { resumo: Resumo; alertas: AlertaGrupo[]; pontos: Ponto[]; gerado_em: number }
export interface Rota {
  olt: string; metros: number | null; coords: [number, number][]; cto: string; ceo: string;
  passos: { k: "cabo" | "caixa"; n: string; t: string; m?: number }[];
}
export interface Atendimento {
  uuid: string; chave: string; ponto?: string; causa: string; acao: string; obs: string;
  lat: number | null; lon: number | null; fotos: string[]; tecnico?: string;
  criado_em: number; recebido_em?: number; offline?: boolean; status_no_registro?: string;
}
export interface Evento { ts: number; chave: string; nome: string; evento: "QUEDA" | "VOLTA" }
