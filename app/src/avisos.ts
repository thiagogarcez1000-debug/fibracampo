// Notificação de queda e de volta de pontos críticos (RF07 / US08).
// O app consulta /api/m/eventos a cada 60 s enquanto está aberto ou em segundo plano recente
// e mostra a notificação do Android pelo service worker. Tocar na notificação abre o detalhe do ponto.
import { api } from "./api";
import { gravar, ler } from "./armazenamento";
import type { Evento } from "./tipos";

export function suportaAvisos(): boolean {
  return "Notification" in window && "serviceWorker" in navigator;
}

export function avisosLigados(): boolean {
  return suportaAvisos() && Notification.permission === "granted" && ler("avisos", true);
}

export async function pedirPermissao(): Promise<boolean> {
  if (!suportaAvisos()) return false;
  const p = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  gravar("avisos", p === "granted");
  return p === "granted";
}

export function textoEvento(e: Evento): { titulo: string; corpo: string } {
  return e.evento === "QUEDA"
    ? { titulo: "🔴 Caiu: " + e.nome, corpo: "Ponto crítico fora do ar. Toque para ver o detalhe e a rota." }
    : { titulo: "🟢 Voltou: " + e.nome, corpo: "O ponto crítico voltou a responder." };
}

async function mostrar(e: Evento) {
  const { titulo, corpo } = textoEvento(e);
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification(titulo, {
    body: corpo, tag: e.chave + e.evento, icon: "icons/icone-192.png", badge: "icons/icone-192.png",
    data: { chave: e.chave }, requireInteraction: e.evento === "QUEDA",
  } as NotificationOptions);
}

let timer: ReturnType<typeof setInterval> | null = null;
export function iniciarAvisos(aoEvento: (e: Evento) => void): void {
  if (timer) return;
  const checar = async () => {
    try {
      const desde = ler<number>("avisos_desde", Date.now() / 1000);
      const r = await api.eventos(desde);
      gravar("avisos_desde", r.agora);
      for (const e of r.eventos) {
        aoEvento(e);
        if (avisosLigados()) await mostrar(e);
      }
    } catch { /* sem sinal: tenta na próxima */ }
  };
  checar();
  timer = setInterval(checar, 60000);
}
