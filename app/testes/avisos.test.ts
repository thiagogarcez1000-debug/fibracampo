import assert from "node:assert/strict";
import { test } from "node:test";
import { textoEvento } from "../src/avisos";

test("texto da notificação de queda e de volta", () => {
  const q = textoEvento({ ts: 1, chave: "ONU:1", nome: "SAMU - Base Central", evento: "QUEDA" });
  assert.match(q.titulo, /Caiu: SAMU/);
  const v = textoEvento({ ts: 2, chave: "ONU:1", nome: "SAMU - Base Central", evento: "VOLTA" });
  assert.match(v.titulo, /Voltou: SAMU/);
});
