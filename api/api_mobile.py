# -*- coding: utf-8 -*-
"""
api_mobile.py - rotas /api/m/* usadas pelo aplicativo FibraCampo (Programação Mobile Aplicada).

Este módulo é "plugado" no servidor do Painel NOC (noc.py), do mesmo jeito que portal.py e chamados.py:
    get(noc, caminho, q, sessao)   -> (codigo, corpo) ou None
    post(noc, caminho, dados, sessao) -> (codigo, corpo) ou None

Ele não fala com OLT nem ONU diretamente: só lê o que o monitor do NOC já tem em memória
(noc.monitor.lista(), resumo(), alertas_grupo(), rota_de(), _ping()) e grava os atendimentos
de campo em atendimentos_mobile.json + pasta atendimentos_fotos/.
"""
import base64
import json
import os
import re
import threading
import time
import uuid as _uuid
from datetime import datetime

ARQ_ATEND = "atendimentos_mobile.json"
PASTA_FOTOS = "atendimentos_fotos"
MAX_FOTOS = 3
MAX_FOTO_BYTES = 1_500_000          # ~1,5 MB por foto (o app já envia comprimida)
CRITICOS_PADRAO = ["SAMU", "UPA", "HOSPITAL", "CAIS", "POLICLINICA", "MATERNIDADE"]

_trava = threading.Lock()
_eventos = []                        # quedas/voltas de pontos críticos, para o app notificar
_ultimo_status = {}                  # chave -> status visto na última consulta


# ---------------------------------------------------------------- utilidades
def _agora():
    return time.time()


def _criticos(noc):
    try:
        lista = noc.cfg.get("MOBILE_CRITICOS") or CRITICOS_PADRAO
    except Exception:
        lista = CRITICOS_PADRAO
    return [str(x).upper() for x in lista]


def eh_critico(noc, item):
    nome = str(item.get("nome", "")).upper()
    return any(c in nome for c in _criticos(noc))


def _ler_atend():
    if not os.path.exists(ARQ_ATEND):
        return []
    try:
        with open(ARQ_ATEND, encoding="utf-8") as f:
            return json.load(f)
    except (ValueError, OSError):
        return []


def _gravar_atend(lista):
    tmp = ARQ_ATEND + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(lista, f, ensure_ascii=False, indent=1)
    os.replace(tmp, ARQ_ATEND)


def _item(noc, chave):
    return next((i for i in noc.monitor.lista() if i["chave"] == chave), None)


def _limpo(txt, n=500):
    return re.sub(r"[\x00-\x08\x0b-\x1f]", "", str(txt or "")).strip()[:n]


def _ponto_curto(noc, i):
    """Só o que o celular precisa (menos dados no 4G - RNF03)."""
    return {"chave": i["chave"], "base": i["base"], "nome": i["nome"], "status": i["status"],
            "olt": i.get("olt", ""), "gpon": i.get("gpon", ""), "serial": i.get("serial", ""),
            "ip": i.get("ip", ""), "cto": i.get("cto", ""), "tipo": i.get("tipo", ""),
            "endereco": i.get("endereco", ""), "lat": i.get("lat"), "lon": i.get("lon"),
            "parado_min": i.get("parado_min"), "critico": eh_critico(noc, i)}


def _registrar_eventos(noc, itens):
    """Compara o status atual com o anterior e guarda QUEDA/VOLTA de pontos críticos (RF07)."""
    with _trava:
        for i in itens:
            ant = _ultimo_status.get(i["chave"])
            _ultimo_status[i["chave"]] = i["status"]
            if ant is None or ant == i["status"] or not eh_critico(noc, i):
                continue
            if i["status"] == "OFFLINE" or (i["status"] == "ONLINE" and ant == "OFFLINE"):
                _eventos.append({"ts": _agora(), "chave": i["chave"], "nome": i["nome"],
                                 "evento": "QUEDA" if i["status"] == "OFFLINE" else "VOLTA"})
        del _eventos[:-200]


def monitorar(noc, intervalo=20):
    """Thread opcional: observa o monitor mesmo sem ninguém com o app aberto."""
    def laco():
        while True:
            try:
                _registrar_eventos(noc, noc.monitor.lista())
            except Exception as e:      # nunca derruba o servidor
                print("[MOBILE] monitor:", e)
            time.sleep(intervalo)
    threading.Thread(target=laco, daemon=True, name="mobile-monitor").start()


# ---------------------------------------------------------------- GET
def get(noc, caminho, q, sessao):
    if not caminho.startswith("/api/m/"):
        return None
    if not sessao:
        return 401, {"erro": "login"}

    if caminho == "/api/m/eu":
        return 200, {"usuario": sessao.get("usuario", ""), "perfil": sessao.get("perfil", "")}

    if caminho == "/api/m/pontos":
        itens = noc.monitor.lista()
        _registrar_eventos(noc, itens)
        return 200, {"resumo": noc.monitor.resumo(), "alertas": noc.monitor.alertas_grupo(),
                     "pontos": [_ponto_curto(noc, i) for i in itens], "gerado_em": _agora()}

    if caminho == "/api/m/ponto":
        it = _item(noc, q.get("chave", ""))
        if not it:
            return 404, {"erro": "Ponto não encontrado."}
        try:
            rota = noc.monitor.rota_de(next(i for i in noc.monitor.itens if i["chave"] == it["chave"]))
        except Exception:
            rota = None
        return 200, {"ponto": _ponto_curto(noc, it), "rota": rota}

    if caminho == "/api/m/atendimentos":
        chave = q.get("chave", "")
        with _trava:
            lista = [a for a in _ler_atend() if not chave or a["chave"] == chave]
        lista.sort(key=lambda a: a.get("criado_em", 0), reverse=True)
        return 200, {"atendimentos": [{k: v for k, v in a.items() if k != "fotos_b64"} for a in lista[:100]]}

    if caminho == "/api/m/foto":
        nome = os.path.basename(q.get("f", ""))
        arq = os.path.join(PASTA_FOTOS, nome)
        if not re.fullmatch(r"[\w\-]+\.jpg", nome) or not os.path.exists(arq):
            return 404, {"erro": "foto"}
        with open(arq, "rb") as f:
            return 200, f.read(), "image/jpeg"

    if caminho == "/api/m/eventos":
        try:
            desde = float(q.get("desde", 0))
        except ValueError:
            desde = 0
        _registrar_eventos(noc, noc.monitor.lista())
        with _trava:
            return 200, {"eventos": [e for e in _eventos if e["ts"] > desde], "agora": _agora()}

    return 404, {"erro": "rota mobile não encontrada"}


# ---------------------------------------------------------------- POST
def post(noc, caminho, dados, sessao):
    if not caminho.startswith("/api/m/"):
        return None
    if not sessao:
        return 401, {"ok": False, "erro": "login"}

    if caminho == "/api/m/testar":
        it = _item(noc, str(dados.get("chave", "")))
        if not it:
            return 404, {"ok": False, "erro": "Ponto não encontrado."}
        if not it.get("ip"):
            return 400, {"ok": False, "erro": "Ponto sem IP cadastrado."}
        t0 = _agora()
        try:
            responde = bool(noc.monitor._ping(it["ip"]))
        except Exception as e:
            return 200, {"ok": True, "resultado": "SEM_RESPOSTA", "erro": str(e)}
        return 200, {"ok": True, "resultado": "ONLINE" if responde else "OFFLINE",
                     "ms": int((_agora() - t0) * 1000), "quando": datetime.now().strftime("%d/%m/%Y %H:%M:%S")}

    if caminho == "/api/m/atendimento":
        return _salvar_atendimento(noc, dados, sessao)

    return 404, {"ok": False, "erro": "rota mobile não encontrada"}


def _salvar_atendimento(noc, d, sessao):
    uid = str(d.get("uuid", "")).strip()
    if not re.fullmatch(r"[0-9a-fA-F\-]{8,40}", uid):
        return 400, {"ok": False, "erro": "uuid inválido"}
    it = _item(noc, str(d.get("chave", "")))
    if not it:
        return 404, {"ok": False, "erro": "Ponto não encontrado."}
    causa = _limpo(d.get("causa"), 80)
    if not causa:
        return 400, {"ok": False, "erro": "Informe a causa."}

    with _trava:
        lista = _ler_atend()
        if any(a["uuid"] == uid for a in lista):        # reenvio da fila offline: não duplica (RNF04)
            return 200, {"ok": True, "uuid": uid, "duplicado": True}

        os.makedirs(PASTA_FOTOS, exist_ok=True)
        fotos = []
        for n, b64 in enumerate((d.get("fotos") or [])[:MAX_FOTOS]):
            try:
                bruto = base64.b64decode(str(b64).split(",")[-1], validate=True)
            except (ValueError, TypeError):
                continue
            if len(bruto) > MAX_FOTO_BYTES or not bruto.startswith(b"\xff\xd8"):
                continue                                    # só JPEG e com tamanho razoável
            nome = f"{uid}_{n + 1}.jpg"
            with open(os.path.join(PASTA_FOTOS, nome), "wb") as f:
                f.write(bruto)
            fotos.append(nome)

        def num(v):
            try:
                return round(float(v), 6)
            except (TypeError, ValueError):
                return None

        reg = {"uuid": uid, "chave": it["chave"], "ponto": it["nome"], "causa": causa,
               "acao": _limpo(d.get("acao"), 300), "obs": _limpo(d.get("obs"), 1000),
               "status_no_registro": _limpo(d.get("status_teste"), 20) or it["status"],
               "lat": num(d.get("lat")), "lon": num(d.get("lon")), "fotos": fotos,
               "tecnico": sessao.get("usuario", ""), "criado_em": num(d.get("criado_em")) or _agora(),
               "recebido_em": _agora(), "offline": bool(d.get("offline"))}
        lista.append(reg)
        _gravar_atend(lista)
    try:
        noc_audit = getattr(noc, "auditar", None)
        if noc_audit:
            noc_audit(sessao.get("usuario", ""), "atendimento_mobile", f"{it['nome']} - {causa}")
    except Exception:
        pass
    return 200, {"ok": True, "uuid": uid, "fotos": len(fotos)}


# ---------------------------------------------------------------- app (arquivos do PWA)
PASTA_APP = "app_mobile"          # conteúdo da pasta app/dist do projeto FibraCampo
TIPOS = {".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
         ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml",
         ".webmanifest": "application/manifest+json", ".json": "application/json"}


def estatico(caminho):
    """Serve o app em /app/ (sem login: são só os arquivos da tela; os dados exigem token)."""
    if caminho == "/app":
        return 301, b"", "text/plain", {"Location": "/app/"}
    if not caminho.startswith("/app/"):
        return None
    rel = caminho[5:] or "index.html"
    if ".." in rel or rel.startswith(("/", "\\")):
        return 404, {"erro": "arquivo"}
    arq = os.path.join(PASTA_APP, *rel.split("/"))
    ext = os.path.splitext(arq)[1].lower()
    if not os.path.isfile(arq) or ext not in TIPOS:
        return 404, {"erro": "arquivo"}
    with open(arq, "rb") as f:
        extra = {"Cache-Control": "no-cache"} if rel in ("sw.js", "index.html") else None
        return (200, f.read(), TIPOS[ext], extra) if extra else (200, f.read(), TIPOS[ext])


def novo_uuid():
    return str(_uuid.uuid4())
