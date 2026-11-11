# -*- coding: utf-8 -*-
"""
Liga o api_mobile.py ao servidor do Painel NOC (noc.py) - FibraCampo / Programação Mobile Aplicada.

Uso (na pasta do Gerenciador de ONUs, com o sistema FECHADO):
    python instalar_api_mobile.py            -> aplica (faz backup noc_antes_mobile_AAAAMMDD_HHMM.py)
    python instalar_api_mobile.py --checar   -> só diz o que falta, sem alterar nada

O que muda no noc.py (6 pontos, todos pequenos):
  1. importa o api_mobile (se faltar o arquivo, o NOC continua funcionando como antes);
  2. aceita o token também no cabeçalho "Authorization: Bearer <token>" (o app não usa cookie);
  3. o /login devolve o token no corpo da resposta (o app guarda no armazenamento seguro);
  4. encaminha GET e POST de /api/m/* para o api_mobile;
  5. serve os arquivos do app em /app/ (pasta app_mobile);
  6. inicia a thread que observa quedas/voltas de pontos críticos (notificações).
"""
import os
import shutil
import sys
from datetime import datetime

ARQ = "noc.py"
MARCA = "# [FibraCampo]"

TROCAS = [
    ("import",
     "try:\n    import unifi           # Wi-Fi interno",
     "try:\n    import api_mobile      # [FibraCampo] rotas /api/m/* do aplicativo de campo\nexcept Exception:\n    api_mobile = None\n"
     "try:\n    import unifi           # Wi-Fi interno"),
    ("bearer",
     "            def _token(self):\n                for parte",
     "            def _token(self):\n"
     "                aut = self.headers.get(\"Authorization\", \"\")  # [FibraCampo] token do app\n"
     "                if aut.startswith(\"Bearer \") and aut[7:].strip() in noc.sessoes:\n"
     "                    return aut[7:].strip()\n"
     "                for parte"),
    ("login",
     "return self._env(200, {\"ok\": True, \"perfil\": perfil}, extra={",
     "return self._env(200, {\"ok\": True, \"perfil\": perfil, \"token\": tok}, extra={  # [FibraCampo] token no corpo"),
    ("app",
     "                if u.path.startswith(\"/img/\"):",
     "                if api_mobile and (u.path == \"/app\" or u.path.startswith(\"/app/\")) and self._portal(api_mobile.estatico(u.path)):  # [FibraCampo] o app\n"
     "                    return\n"
     "                if u.path.startswith(\"/img/\"):"),
    ("get",
     "                if portal and u.path.startswith(\"/api/portal/\") and self._portal(portal.get(",
     "                if api_mobile and u.path.startswith(\"/api/m/\") and self._portal(api_mobile.get(noc, u.path, q, self._sessao())):  # [FibraCampo]\n"
     "                    return\n"
     "                if portal and u.path.startswith(\"/api/portal/\") and self._portal(portal.get("),
    ("post",
     "                if portal and u.path.startswith(\"/api/portal/\") and self._portal(portal.post(",
     "                if api_mobile and u.path.startswith(\"/api/m/\") and self._portal(api_mobile.post(noc, u.path, dados, self._sessao())):  # [FibraCampo]\n"
     "                    return\n"
     "                if portal and u.path.startswith(\"/api/portal/\") and self._portal(portal.post("),
    ("monitor",
     "        threading.Thread(target=_vigiar_diag_rede, daemon=True, name=\"diag-rede\").start()\n",
     "        threading.Thread(target=_vigiar_diag_rede, daemon=True, name=\"diag-rede\").start()\n"
     "        if api_mobile:  # [FibraCampo] quedas/voltas de pontos críticos\n"
     "            api_mobile.monitorar(_INSTANCIA)\n"),
]


def main():
    so_checar = "--checar" in sys.argv
    if not os.path.exists(ARQ):
        print("Rode este script dentro da pasta do Gerenciador de ONUs (onde está o noc.py).")
        return 1
    with open(ARQ, encoding="utf-8") as f:
        txt = f.read()
    faltando = []
    for nome, antes, depois in TROCAS:
        if depois in txt:
            continue
        if txt.count(antes) != 1:
            print(f"[ERRO] trecho '{nome}' não encontrado (ou repetido) no noc.py - nada foi alterado.")
            return 2
        faltando.append(nome)
        txt = txt.replace(antes, depois, 1)
    if not faltando:
        print("O noc.py já está com a API mobile ligada. Nada a fazer.")
        return 0
    if so_checar:
        print("Faltam aplicar:", ", ".join(faltando))
        return 0
    bkp = f"noc_antes_mobile_{datetime.now():%Y%m%d_%H%M}.py"
    shutil.copy2(ARQ, bkp)
    with open(ARQ, "w", encoding="utf-8") as f:
        f.write(txt)
    compile(txt, ARQ, "exec")
    print(f"OK - aplicado: {', '.join(faltando)}. Backup em {bkp}.")
    print("Copie também o api_mobile.py para esta pasta e reinicie o sistema.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
