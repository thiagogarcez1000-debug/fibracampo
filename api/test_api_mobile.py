# -*- coding: utf-8 -*-
"""Testes da API mobile.
Rodar:  python test_api_mobile.py   (ou  python -m pytest -q, se tiver o pytest)."""
import base64
import json
import os
import threading
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

try:
    import pytest
    fixture = pytest.fixture()
except ImportError:          # roda sem pytest também
    def fixture(f):
        return f

import api_mobile
import servidor_dev

JPEG_MINIMO = base64.b64encode(b"\xff\xd8\xff\xe0" + b"0" * 200 + b"\xff\xd9").decode()


@fixture
def srv(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    api_mobile._eventos.clear()
    api_mobile._ultimo_status.clear()
    noc = servidor_dev.FakeNOC()
    s = ThreadingHTTPServer(("127.0.0.1", 0), servidor_dev.criar_handler(noc))
    threading.Thread(target=s.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{s.server_address[1]}", noc
    s.shutdown()


def req(url, metodo="GET", corpo=None, token=None):
    r = urllib.request.Request(url, method=metodo, data=json.dumps(corpo).encode() if corpo is not None else None,
                               headers={"Content-Type": "application/json", **({"Authorization": f"Bearer {token}"} if token else {})})
    try:
        with urllib.request.urlopen(r, timeout=5) as x:
            return x.status, json.loads(x.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def login(base, u="tecnico", s="campo123"):
    st, j = req(base + "/login", "POST", {"usuario": u, "senha": s})
    return st, j.get("token")


def test_login_errado_recusado(srv):
    base, _ = srv
    st, tok = login(base, s="errada")
    assert st == 401 and tok is None


def test_sem_token_nao_ve_dados(srv):
    base, _ = srv
    assert req(base + "/api/m/pontos")[0] == 401


def test_lista_de_pontos_igual_ao_monitor(srv):
    base, noc = srv
    _, tok = login(base)
    st, j = req(base + "/api/m/pontos", token=tok)
    assert st == 200
    fora_app = {p["chave"] for p in j["pontos"] if p["status"] == "OFFLINE"}
    fora_noc = {i["chave"] for i in noc.monitor.lista() if i["status"] == "OFFLINE"}
    assert fora_app == fora_noc and len(fora_app) == j["resumo"]["offline"]      # CA01
    samu = next(p for p in j["pontos"] if "SAMU" in p["nome"])
    assert samu["critico"] and samu["parado_min"] is not None
    assert "senha" not in json.dumps(j).lower()                                   # nada de senha no app


def test_detalhe_com_rota(srv):
    base, noc = srv
    _, tok = login(base)
    chave = noc.monitor.itens[0]["chave"]
    st, j = req(base + "/api/m/ponto?chave=" + chave, token=tok)
    assert st == 200 and j["ponto"]["chave"] == chave and len(j["rota"]["coords"]) >= 2
    assert req(base + "/api/m/ponto?chave=nao-existe", token=tok)[0] == 404


def test_testar_agora(srv):
    base, noc = srv
    _, tok = login(base)
    fora = next(i for i in noc.monitor.itens if i["status"] == "OFFLINE")
    assert req(base + "/api/m/testar", "POST", {"chave": fora["chave"]}, tok)[1]["resultado"] == "OFFLINE"
    req(base + "/dev/alternar", "POST", {"chave": fora["chave"]}, tok)          # "técnico consertou"
    st, j = req(base + "/api/m/testar", "POST", {"chave": fora["chave"]}, tok)
    assert st == 200 and j["resultado"] == "ONLINE"                              # CA04


def test_atendimento_offline_nao_duplica(srv):
    base, noc = srv
    _, tok = login(base)
    chave = noc.monitor.itens[0]["chave"]
    reg = {"uuid": api_mobile.novo_uuid(), "chave": chave, "causa": "Rompimento de fibra", "acao": "Emenda no poste",
           "obs": "teste", "lat": -16.33, "lon": -48.95, "fotos": [JPEG_MINIMO, "nao-e-foto"], "offline": True,
           "criado_em": 1792000000}
    st, j = req(base + "/api/m/atendimento", "POST", reg, tok)
    assert st == 200 and j["fotos"] == 1                                          # só o JPEG válido
    st, j = req(base + "/api/m/atendimento", "POST", reg, tok)                    # reenvio da fila
    assert j.get("duplicado") is True
    st, j = req(base + "/api/m/atendimentos?chave=" + chave, token=tok)
    assert len(j["atendimentos"]) == 1                                            # CA03
    a = j["atendimentos"][0]
    assert a["tecnico"] == "tecnico" and a["lat"] == -16.33 and a["offline"] is True
    assert os.path.exists(os.path.join(api_mobile.PASTA_FOTOS, a["fotos"][0]))


def test_atendimento_valida_campos(srv):
    base, noc = srv
    _, tok = login(base)
    chave = noc.monitor.itens[0]["chave"]
    assert req(base + "/api/m/atendimento", "POST", {"uuid": "x", "chave": chave, "causa": "a"}, tok)[0] == 400
    assert req(base + "/api/m/atendimento", "POST", {"uuid": api_mobile.novo_uuid(), "chave": chave, "causa": ""}, tok)[0] == 400


def test_eventos_de_ponto_critico(srv):
    base, noc = srv
    _, tok = login(base)
    req(base + "/api/m/pontos", token=tok)                                        # fotografa o estado
    samu = next(i for i in noc.monitor.itens if "SAMU" in i["nome"])
    req(base + "/dev/alternar", "POST", {"chave": samu["chave"]}, tok)            # SAMU volta
    st, j = req(base + "/api/m/eventos?desde=0", token=tok)
    assert any(e["chave"] == samu["chave"] and e["evento"] == "VOLTA" for e in j["eventos"])
    escola = next(i for i in noc.monitor.itens if "Biblioteca" in i["nome"])
    req(base + "/dev/alternar", "POST", {"chave": escola["chave"]}, tok)          # não crítico: sem aviso
    _, j = req(base + "/api/m/eventos?desde=0", token=tok)
    assert not any(e["chave"] == escola["chave"] for e in j["eventos"])


if __name__ == "__main__":
    import inspect
    import sys
    import tempfile

    class _MP:
        def chdir(self, p):
            os.chdir(p)

    ok = falhas = 0
    for nome, fn in sorted(globals().items()):
        if not nome.startswith("test_") or not inspect.isfunction(fn):
            continue
        with tempfile.TemporaryDirectory() as tmp:
            antes = os.getcwd()
            g = srv(tmp, _MP())
            try:
                fn(next(g))
                print("OK    ", nome)
                ok += 1
            except AssertionError as e:
                print("FALHOU", nome, e)
                falhas += 1
            finally:
                next(g, None)
                os.chdir(antes)
    print(f"\n{ok} testes ok, {falhas} falha(s)")
    sys.exit(1 if falhas else 0)
