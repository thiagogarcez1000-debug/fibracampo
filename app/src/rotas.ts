// Navegação simples por "hash" (#/inicio, #/ponto/<chave> ...): funciona offline e no botão voltar do Android.
import { useEffect, useState } from "react";

export type Rota = { tela: string; arg: string };

export function lerRota(): Rota {
  const [, tela = "inicio", ...resto] = (location.hash || "#/inicio").slice(1).split("/");
  return { tela, arg: decodeURIComponent(resto.join("/")) };
}

export function ir(tela: string, arg = ""): void {
  location.hash = "/" + tela + (arg ? "/" + encodeURIComponent(arg) : "");
}

export function voltar(): void {
  if (history.length > 1) history.back();
  else ir("inicio");
}

export function useRota(): Rota {
  const [r, setR] = useState(lerRota());
  useEffect(() => {
    const f = () => { setR(lerRota()); window.scrollTo(0, 0); };
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  return r;
}
