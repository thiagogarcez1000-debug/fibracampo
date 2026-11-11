// Fila offline de atendimentos (RF09 / RNF04).
// Cada registro ganha um uuid no celular; a API ignora reenvios do mesmo uuid, então
// reenviar depois de uma queda de sinal nunca duplica o atendimento.
import type { Atendimento } from "./tipos";

export type ItemFila = Atendimento & { fotos_b64: string[]; tentativas: number; ultimoErro?: string };

export interface Deposito {
  todos(): Promise<ItemFila[]>;
  salvar(i: ItemFila): Promise<void>;
  remover(uuid: string): Promise<void>;
}

/** IndexedDB: aguenta fotos (localStorage tem limite de ~5 MB). */
export function depositoIndexedDB(nome = "fibracampo"): Deposito {
  const abrir = () => new Promise<IDBDatabase>((ok, falha) => {
    const r = indexedDB.open(nome, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("fila", { keyPath: "uuid" });
    r.onsuccess = () => ok(r.result);
    r.onerror = () => falha(r.error);
  });
  const tx = async <T>(modo: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>) => {
    const db = await abrir();
    return new Promise<T>((ok, falha) => {
      const req = f(db.transaction("fila", modo).objectStore("fila"));
      req.onsuccess = () => ok(req.result);
      req.onerror = () => falha(req.error);
    }).finally(() => db.close());
  };
  return {
    todos: () => tx<ItemFila[]>("readonly", (s) => s.getAll() as IDBRequest<ItemFila[]>),
    salvar: async (i) => { await tx("readwrite", (s) => s.put(i)); },
    remover: async (uuid) => { await tx("readwrite", (s) => s.delete(uuid)); },
  };
}

export function depositoMemoria(): Deposito {
  const m = new Map<string, ItemFila>();
  return {
    todos: async () => [...m.values()],
    salvar: async (i) => { m.set(i.uuid, structuredClone(i)); },
    remover: async (u) => { m.delete(u); },
  };
}

export type Enviar = (i: ItemFila) => Promise<{ ok: boolean }>;

export class Fila {
  private enviando = false;
  private ouvintes = new Set<(n: number) => void>();
  constructor(private dep: Deposito, private enviar: Enviar) {}

  async adicionar(a: Atendimento, fotos_b64: string[]): Promise<void> {
    await this.dep.salvar({ ...a, fotos_b64, tentativas: 0 });
    await this.avisar();
  }

  async pendentes(): Promise<ItemFila[]> {
    return (await this.dep.todos()).sort((a, b) => a.criado_em - b.criado_em);
  }

  ouvir(f: (n: number) => void): () => void {
    this.ouvintes.add(f);
    this.avisar();
    return () => { this.ouvintes.delete(f); };
  }

  private async avisar() {
    const n = (await this.dep.todos()).length;
    this.ouvintes.forEach((f) => f(n));
  }

  /** Envia o que estiver na fila, do mais antigo para o mais novo. Devolve quantos foram enviados. */
  async sincronizar(): Promise<number> {
    if (this.enviando) return 0;
    this.enviando = true;
    let enviados = 0;
    try {
      for (const i of await this.pendentes()) {
        try {
          const r = await this.enviar(i);
          if (r.ok) { await this.dep.remover(i.uuid); enviados++; }
        } catch (e: any) {
          await this.dep.salvar({ ...i, tentativas: i.tentativas + 1, ultimoErro: String(e?.message || e) });
          if (!e?.status) break;          // sem sinal: para e tenta de novo depois
        }
      }
    } finally {
      this.enviando = false;
      await this.avisar();
    }
    return enviados;
  }
}

export function novoUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
