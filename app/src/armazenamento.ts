// Dados guardados no aparelho. Só o necessário (RNF08): sessão, endereço do servidor e cache da última lista.
const P = "fibracampo.";

export function ler<T>(chave: string, padrao: T): T {
  try {
    const v = localStorage.getItem(P + chave);
    return v === null ? padrao : (JSON.parse(v) as T);
  } catch {
    return padrao;
  }
}

export function gravar(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(P + chave, JSON.stringify(valor));
  } catch {
    /* armazenamento cheio ou bloqueado: o app segue funcionando sem cache */
  }
}

export function apagarTudo(): void {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith(P)).forEach((k) => localStorage.removeItem(k));
  } catch {
    /* nada a fazer */
  }
}
