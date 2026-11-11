// Liga a fila ao app: tenta enviar ao abrir, quando o sinal volta e a cada 30 s.
import { api } from "./api";
import { depositoIndexedDB, Fila } from "./fila";

export const fila = new Fila(depositoIndexedDB(), (i) => api.enviarAtendimento(i));

let iniciado = false;
export function iniciarSincronia(aoEnviar: (n: number) => void): void {
  if (iniciado) return;
  iniciado = true;
  const tentar = async () => {
    if (!navigator.onLine) return;
    const n = await fila.sincronizar();
    if (n) aoEnviar(n);
  };
  addEventListener("online", tentar);
  setInterval(tentar, 30000);
  tentar();
}
