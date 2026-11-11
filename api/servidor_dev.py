# -*- coding: utf-8 -*-
"""
Servidor de DESENVOLVIMENTO do FibraCampo.

Simula o Painel NOC (mesmo /login, mesmo token, mesmas rotas /api/m/* do api_mobile.py) com
dados de demonstração, para desenvolver e testar o app sem tocar na rede de produção.
Os nomes e IPs abaixo são fictícios (inspirados no incidente da OLT 02), não são da rede real.

    python servidor_dev.py            -> http://0.0.0.0:8770   (usuário: tecnico / senha: campo123)
    python servidor_dev.py --porta 9000
"""
import json
import random
import secrets
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

import api_mobile

USUARIOS = {"tecnico": ("campo123", "tecnico"), "suporte": ("suporte123", "suporte"), "admin": ("admin123", "admin")}

BASE_LAT, BASE_LON = -16.3286, -48.9534        # centro de Anápolis
OLT02 = (-16.3401, -48.9502)


def _pontos_demo():
    nomes = [
        ("SAMU - Base Central", "ONU", 2, 7), ("UPA Norte", "ONU", 2, 8), ("CMEI Jardim das Flores", "ONU", 2, 7),
        ("Escola Municipal Rio Branco", "ONU", 2, 7), ("Secretaria de Educação", "ONU", 2, 8),
        ("Câmera Praça Bom Jesus", "CAMERA", 2, 8), ("Wi-Fi Praça Americano do Brasil", "WIFI", 2, 7),
        ("UBS Vila Jaiara", "ONU", 1, 3), ("Escola Municipal Antensina", "ONU", 1, 4), ("CRAS Leste", "ONU", 3, 1),
        ("Câmera Av. Brasil x Av. Goiás", "CAMERA", 3, 2), ("Wi-Fi Terminal Urbano", "WIFI", 1, 5),
        ("Biblioteca Municipal", "ONU", 4, 2), ("Sede Administrativa", "ONU", 1, 1), ("CMEI Recanto do Sol", "ONU", 5, 6),
        ("Câmera Feira Coberta", "CAMERA", 4, 3), ("Wi-Fi Parque Ipiranga", "WIFI", 6, 1), ("Policlínica Municipal", "ONU", 6, 2),
    ]
    out, rnd = [], random.Random(7)
    for n, (nome, base, olt, pon) in enumerate(nomes, 1):
        lat = BASE_LAT + rnd.uniform(-0.03, 0.03)
        lon = BASE_LON + rnd.uniform(-0.03, 0.03)
        out.append({"chave": f"{base}:{n}", "base": base, "nome": nome, "ip": f"10.99.{olt}.{10 + n}",
                    "status": "ONLINE", "olt": f"OLT 0{olt}", "gpon": str(pon), "id": str(n),
                    "serial": f"FRKW{rnd.randint(10000000, 99999999)}", "cto": f"CTO-{olt}{pon}-{n:02d}",
                    "endereco": "Endereço de demonstração, Anápolis - GO", "tipo": base, "lat": round(lat, 6), "lon": round(lon, 6)})
    return out


class FakeMonitor:
    """Imita os métodos do monitor do NOC usados pelo api_mobile."""
    def __init__(self):
        self.itens = _pontos_demo()
        self.desde = {}
        self.ultima = time.time()
        self.trava = threading.Lock()
        agora = time.time()
        for i in self.itens:                      # cenário: PON 7/8 da OLT 02 fora, como em 06/10
            if i["olt"] == "OLT 02":
                i["status"] = "OFFLINE"
                self.desde[i["chave"]] = agora - random.Random(i["chave"]).randint(20, 190) * 60

    def lista(self):
        agora = time.time()
        with self.trava:
            return [dict(i, status_num=1 if i["status"] == "ONLINE" else 0,
                         desde=self.desde.get(i["chave"]),
                         parado_min=int((agora - self.desde[i["chave"]]) / 60) if i["chave"] in self.desde else None)
                    for i in self.itens]

    def resumo(self):
        l = self.lista()
        bases = {}
        for b, r in (("ONU", "Unidades"), ("CAMERA", "Câmeras"), ("WIFI", "Wi-Fi")):
            x = [i for i in l if i["base"] == b]
            bases[b] = {"rotulo": r, "total": len(x), "online": sum(i["status"] == "ONLINE" for i in x),
                        "offline": sum(i["status"] == "OFFLINE" for i in x)}
        return {"bases": bases, "total": len(l), "online": sum(i["status"] == "ONLINE" for i in l),
                "offline": sum(i["status"] == "OFFLINE" for i in l),
                "ultima_varredura": time.strftime("%d/%m %H:%M:%S", time.localtime(self.ultima)), "em_varredura": False}

    def alertas_grupo(self):
        grupos = {}
        for i in self.lista():
            k = f"{i['olt']} · PON {i['gpon']}"
            g = grupos.setdefault(k, [0, 0])
            g[1] += 1
            g[0] += i["status"] == "OFFLINE"
        return [{"tipo": "PON", "nome": k, "fora": f, "total": t} for k, (f, t) in grupos.items() if f >= 2]

    def rota_de(self, it):
        lat, lon = it["lat"], it["lon"]
        meio = ((lat + OLT02[0]) / 2 + 0.004, (lon + OLT02[1]) / 2 - 0.003)
        return {"olt": it["olt"], "metros": 3200, "coords": [[lat, lon], list(meio), list(OLT02)],
                "cto": it["cto"], "ceo": "CEO-12", "passos": [{"k": "caixa", "n": it["cto"], "t": "CTO"},
                                                             {"k": "cabo", "n": "Cabo 12FO", "t": "12 fibras", "m": 1850},
                                                             {"k": "caixa", "n": "CEO-12", "t": "CEO"}]}

    def _ping(self, ip):
        time.sleep(0.4)
        it = next(i for i in self.itens if i["ip"] == ip)
        return it["status"] == "ONLINE"

    def alternar(self, chave):
        """Só no servidor de dev: simula o reparo/queda de um ponto."""
        with self.trava:
            it = next(i for i in self.itens if i["chave"] == chave)
            if it["status"] == "OFFLINE":
                it["status"] = "ONLINE"
                self.desde.pop(chave, None)
            else:
                it["status"] = "OFFLINE"
                self.desde[chave] = time.time()
            return it["status"]


class FakeNOC:
    def __init__(self):
        self.monitor = FakeMonitor()
        self.sessoes = {}
        self.cfg = {"MOBILE_CRITICOS": api_mobile.CRITICOS_PADRAO}


def criar_handler(noc):
    class H(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _env(self, cod, corpo, tipo="application/json; charset=utf-8", extra=None):
            if not isinstance(corpo, (bytes, bytearray)):
                corpo = json.dumps(corpo, ensure_ascii=False).encode("utf-8")
            self.send_response(cod)
            self.send_header("Content-Type", tipo)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
            for k, v in (extra or {}).items():
                self.send_header(k, v)
            self.send_header("Content-Length", str(len(corpo)))
            self.end_headers()
            self.wfile.write(corpo)

        def _sessao(self):
            aut = self.headers.get("Authorization", "")
            return noc.sessoes.get(aut[7:].strip()) if aut.startswith("Bearer ") else None

        def _r(self, r):
            if r is None:
                return self._env(404, {"erro": "não encontrado"})
            self._env(r[0], r[1], r[2] if len(r) > 2 else "application/json; charset=utf-8", r[3] if len(r) > 3 else None)

        def do_OPTIONS(self):
            self._env(204, b"")

        def do_GET(self):
            u = urlparse(self.path)
            q = {k: v[0] for k, v in parse_qs(u.query).items()}
            if u.path == "/":
                return self._env(302, b"", "text/plain", {"Location": "/app/"})
            if u.path == "/app" or u.path.startswith("/app/"):
                return self._r(api_mobile.estatico(u.path))
            self._r(api_mobile.get(noc, u.path, q, self._sessao()))

        def do_POST(self):
            u = urlparse(self.path)
            n = int(self.headers.get("Content-Length", 0) or 0)
            try:
                dados = json.loads(self.rfile.read(n) or b"{}")
            except ValueError:
                dados = {}
            if u.path == "/login":
                usu = str(dados.get("usuario", "")).strip().lower()
                ok = USUARIOS.get(usu)
                if ok and secrets.compare_digest(ok[0], str(dados.get("senha", ""))):
                    tok = secrets.token_urlsafe(24)
                    noc.sessoes[tok] = {"perfil": ok[1], "usuario": usu, "desde": time.time()}
                    return self._env(200, {"ok": True, "perfil": ok[1], "token": tok})
                time.sleep(0.5)
                return self._env(401, {"erro": "senha"})
            if u.path == "/logout":
                aut = self.headers.get("Authorization", "")
                noc.sessoes.pop(aut[7:].strip(), None)
                return self._env(200, {"ok": True})
            if u.path == "/dev/alternar" and self._sessao():
                return self._env(200, {"status": noc.monitor.alternar(dados.get("chave"))})
            self._r(api_mobile.post(noc, u.path, dados, self._sessao()))
    return H


def main():
    porta = int(sys.argv[sys.argv.index("--porta") + 1]) if "--porta" in sys.argv else 8770
    import os
    dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "dist")
    if os.path.isdir(dist):
        api_mobile.PASTA_APP = dist          # usa o build do app direto da pasta do projeto
    noc = FakeNOC()
    srv = ThreadingHTTPServer(("0.0.0.0", porta), criar_handler(noc))
    print(f"FibraCampo - servidor de desenvolvimento em http://0.0.0.0:{porta}  (tecnico / campo123)")
    srv.serve_forever()


if __name__ == "__main__":
    main()
