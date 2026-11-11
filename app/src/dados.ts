// Lista de pontos com cache no aparelho: o app abre mesmo sem sinal, mostrando a última lista e a hora dela.
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { gravar, ler } from "./armazenamento";
import type { RespPontos } from "./tipos";

export function usePontos(intervaloMs = 30000) {
  const [dados, setDados] = useState<RespPontos | null>(() => ler<RespPontos | null>("cache_pontos", null));
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [doCache, setDoCache] = useState(!!dados);
  const vivo = useRef(true);

  const atualizar = useCallback(async () => {
    setCarregando(true);
    try {
      const d = await api.pontos();
      if (!vivo.current) return;
      setDados(d); setDoCache(false); setErro("");
      gravar("cache_pontos", d);
    } catch (e: any) {
      if (vivo.current) setErro(e.message);
    } finally {
      if (vivo.current) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    vivo.current = true;
    atualizar();
    // atualização periódica (não contínua) e só com o app visível: economiza bateria e 4G (RNF09)
    const t = setInterval(() => { if (document.visibilityState === "visible") atualizar(); }, intervaloMs);
    const vis = () => { if (document.visibilityState === "visible") atualizar(); };
    document.addEventListener("visibilitychange", vis);
    return () => { vivo.current = false; clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [atualizar, intervaloMs]);

  return { dados, erro, carregando, doCache, atualizar };
}
