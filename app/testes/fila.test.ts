import assert from "node:assert/strict";
import { test } from "node:test";
import { depositoMemoria, Fila, novoUuid, type ItemFila } from "../src/fila";
import type { Atendimento } from "../src/tipos";

const at = (n: number): Atendimento => ({ uuid: novoUuid(), chave: "ONU:1", ponto: "SAMU", causa: "Rompimento de fibra",
  acao: "", obs: "", lat: -16.3, lon: -48.9, fotos: [], criado_em: 1000 + n });
const semSinal = () => Object.assign(new Error("Sem conexão"), { status: 0 });

test("sem sinal: fica na fila e não perde nada", async () => {
  const f = new Fila(depositoMemoria(), async () => { throw semSinal(); });
  await f.adicionar(at(1), ["data:image/jpeg;base64,AAA"]);
  await f.adicionar(at(2), []);
  assert.equal(await f.sincronizar(), 0);
  const p = await f.pendentes();
  assert.equal(p.length, 2);
  assert.equal(p[0].tentativas, 1);                    // parou no 1º: não gasta bateria tentando os outros
  assert.equal(p[1].tentativas, 0);
  assert.equal(p[0].fotos_b64.length, 1);
});

test("sinal volta: envia em ordem e esvazia a fila", async () => {
  let online = false;
  const enviados: number[] = [];
  const f = new Fila(depositoMemoria(), async (i: ItemFila) => {
    if (!online) throw semSinal();
    enviados.push(i.criado_em);
    return { ok: true };
  });
  await f.adicionar(at(2), []); await f.adicionar(at(1), []);
  await f.sincronizar();
  online = true;
  assert.equal(await f.sincronizar(), 2);
  assert.deepEqual(enviados, [1001, 1002]);
  assert.equal((await f.pendentes()).length, 0);
});

test("erro do servidor em um registro não trava os outros", async () => {
  const f = new Fila(depositoMemoria(), async (i: ItemFila) => {
    if (i.causa === "ruim") throw Object.assign(new Error("Informe a causa."), { status: 400 });
    return { ok: true };
  });
  await f.adicionar({ ...at(1), causa: "ruim" }, []);
  await f.adicionar(at(2), []);
  assert.equal(await f.sincronizar(), 1);
  const p = await f.pendentes();
  assert.equal(p.length, 1);
  assert.equal(p[0].ultimoErro, "Informe a causa.");
});

test("contador de pendentes avisa a tela", async () => {
  const f = new Fila(depositoMemoria(), async () => ({ ok: true }));
  const vistos: number[] = [];
  f.ouvir((n) => vistos.push(n));
  await f.adicionar(at(1), []);
  await f.sincronizar();
  assert.ok(vistos.includes(1));
  assert.equal(vistos.at(-1), 0);
});

test("uuid no formato aceito pela API", () => {
  assert.match(novoUuid(), /^[0-9a-f-]{36}$/);
});
