import assert from "node:assert/strict";
import { test } from "node:test";
import type { Ponto } from "../src/tipos";
import { filtrar, FILTRO_VAZIO, linkComoChegar, normalizar, ordenarPrioridade, paraPixel, tempoFora, zoomQueCabe } from "../src/util";

const p = (x: Partial<Ponto>): Ponto => ({
  chave: "k", base: "ONU", nome: "X", status: "ONLINE", olt: "OLT 01", gpon: "1", serial: "", ip: "", cto: "",
  tipo: "", endereco: "", lat: null, lon: null, parado_min: null, critico: false, ...x,
});

test("tempo fora do ar em texto curto", () => {
  assert.equal(tempoFora(null), "");
  assert.equal(tempoFora(0), "agora");
  assert.equal(tempoFora(12), "há 12 min");
  assert.equal(tempoFora(125), "há 2 h 05 min");
  assert.equal(tempoFora(1500), "há 1 dia e 1 h");
});

test("busca ignora acento e maiúsculas e acha por serial/IP/CTO", () => {
  const l = [p({ chave: "1", nome: "Câmera Praça" }), p({ chave: "2", serial: "FRKW123" }), p({ chave: "3", cto: "CTO-27-01" })];
  assert.equal(normalizar("  CÂMERA "), "camera");
  assert.deepEqual(filtrar(l, { ...FILTRO_VAZIO, texto: "camera" }).map((x) => x.chave), ["1"]);
  assert.deepEqual(filtrar(l, { ...FILTRO_VAZIO, texto: "frkw" }).map((x) => x.chave), ["2"]);
  assert.deepEqual(filtrar(l, { ...FILTRO_VAZIO, texto: "27-01" }).map((x) => x.chave), ["3"]);
});

test("filtros de OLT, tipo e só fora do ar", () => {
  const l = [p({ chave: "a", olt: "OLT 02", status: "OFFLINE" }), p({ chave: "b", olt: "OLT 02", base: "CAMERA" }), p({ chave: "c" })];
  assert.deepEqual(filtrar(l, { ...FILTRO_VAZIO, olt: "OLT 02" }).map((x) => x.chave), ["a", "b"]);
  assert.deepEqual(filtrar(l, { ...FILTRO_VAZIO, base: "CAMERA" }).map((x) => x.chave), ["b"]);
  assert.deepEqual(filtrar(l, { ...FILTRO_VAZIO, soFora: true }).map((x) => x.chave), ["a"]);
});

test("prioridade: fora do ar, críticos e mais tempo fora primeiro", () => {
  const l = [
    p({ chave: "online", status: "ONLINE" }),
    p({ chave: "escola", status: "OFFLINE", parado_min: 300 }),
    p({ chave: "samu", status: "OFFLINE", parado_min: 20, critico: true }),
    p({ chave: "creche", status: "OFFLINE", parado_min: 30 }),
  ];
  assert.deepEqual(ordenarPrioridade(l).map((x) => x.chave), ["samu", "escola", "creche", "online"]);
});

test("mapa: projeção e zoom que cabe na tela", () => {
  const [x, y] = paraPixel(0, 0, 1);
  assert.equal(x, 256); assert.ok(Math.abs(y - 256) < 1e-6);
  const perto: [number, number][] = [[-16.33, -48.95], [-16.331, -48.951]];
  const longe: [number, number][] = [[-16.33, -48.95], [-16.40, -48.80]];
  assert.ok(zoomQueCabe(perto, 360, 260) > zoomQueCabe(longe, 360, 260));
  assert.match(linkComoChegar(-16.3, -48.9), /destination=-16.3,-48.9/);
});
