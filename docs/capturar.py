# -*- coding: utf-8 -*-
"""Tira os prints do app em um celular emulado (Chromium + Playwright, perfil Pixel 7 / Android).
Uso: com o servidor_dev.py rodando na porta 8770 ->  python capturar.py <etapa>
"""
import os
import sys

from playwright.sync_api import sync_playwright

URL = os.environ.get("FC_URL", "http://localhost:8770/app/")
SAIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prints")
ETAPA = sys.argv[1] if len(sys.argv) > 1 else "s1"


def entrar(p):
    p.goto(URL)
    p.fill("input[autocomplete=username]", "tecnico")
    p.fill("input[type=password]", "campo123")
    p.click("button.bt")
    p.wait_for_selector(".topo")


def foto(p, nome):
    p.wait_for_timeout(500)
    p.screenshot(path=os.path.join(SAIDA, nome), full_page=False)
    print("print:", nome)


with sync_playwright() as pw:
    nav = pw.chromium.launch(headless=os.environ.get("FC_JANELA") != "1")
    disp = pw.devices["Pixel 7"]
    ctx = nav.new_context(**disp, locale="pt-BR", timezone_id="America/Sao_Paulo",
                          geolocation={"latitude": -16.3401, "longitude": -48.9502}, permissions=["geolocation", "notifications"])
    p = ctx.new_page()
    p.on("console", lambda m: m.type == "error" and print("console:", m.text))
    p.on("pageerror", lambda e: print("ERRO JS:", e))

    if ETAPA == "s1":
        p.goto(URL)
        p.wait_for_selector("form.login")
        foto(p, "s1_01_login.png")
        p.fill("input[autocomplete=username]", "tecnico")
        p.fill("input[type=password]", "errada")
        p.click("button.bt")
        p.wait_for_selector("[role=alert]")
        foto(p, "s1_02_login_senha_errada.png")
        p.fill("input[type=password]", "campo123")
        p.click("button.bt")
        p.wait_for_selector(".resumo")
        foto(p, "s1_03_resumo_api.png")
    if ETAPA == "s2":
        entrar(p)
        p.wait_for_selector(".lista .ponto")
        foto(p, "s2_01_inicio_fora_do_ar.png")
        p.click("nav button:has-text('Buscar')")
        p.fill("input[type=search]", "camera")
        foto(p, "s2_02_busca_camera.png")
        p.fill("input[type=search]", "")
        p.click("button.chip:has-text('Só fora do ar')")
        p.select_option("select", "OLT 02")
        foto(p, "s2_03_filtro_olt.png")
        p.click("button.chip:has-text('Só fora do ar')")
        p.select_option("select", "")
        p.click("nav button:has-text('Início')")
        p.click(".ponto:has-text('SAMU')")
        p.wait_for_selector(".mapa")
        foto(p, "s2_04_detalhe_samu.png")
        p.mouse.wheel(0, 600)
        foto(p, "s2_05_detalhe_mapa_rota.png")
    if ETAPA == "s3":
        import json
        import urllib.request
        entrar(p)
        tok = p.evaluate("JSON.parse(localStorage.getItem('fibracampo.token'))")
        def dev(caminho, corpo=None):
            r = urllib.request.Request(URL.replace("/app/", caminho), data=json.dumps(corpo).encode() if corpo is not None else None,
                                       headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"})
            return json.loads(urllib.request.urlopen(r).read())
        # 1) testar agora com o ponto ainda fora
        p.click(".ponto:has-text('SAMU')")
        p.click("button:has-text('Testar agora')")
        p.wait_for_selector(".resultado")
        foto(p, "s3_01_testar_agora_fora.png")
        # 2) "o técnico faz a emenda": no servidor de dev o ponto volta a responder
        chave = p.evaluate("decodeURIComponent(location.hash.split('/')[2])")
        dev("/dev/alternar", {"chave": chave})
        p.click("button:has-text('Testar agora')")
        p.wait_for_selector(".resultado.ONLINE")
        foto(p, "s3_02_testar_agora_voltou.png")
        # 3) registrar SEM SINAL (modo avião simulado)
        p.click("button:has-text('📝 Registrar')")
        p.wait_for_selector("text=Localização registrada")
        ctx.set_offline(True)
        p.select_option("select", "Rompimento de fibra")
        p.fill("input[placeholder^='Ex.']", "Emenda de 12 fibras no poste novo")
        p.fill("textarea", "Cabo rompido na troca do poste. Teste automatizado da fila offline.")
        p.set_input_files("input[type=file]", os.path.join(os.path.dirname(SAIDA), "foto_teste.jpg"))
        p.wait_for_selector(".fotos .mini")
        foto(p, "s3_03_registro_sem_sinal.png")
        p.click("button:has-text('Salvar atendimento')")
        p.wait_for_selector(".toast")
        foto(p, "s3_04_salvo_no_aparelho.png")
        p.click("nav button:has-text('Envios')")
        p.wait_for_selector(".atend")
        foto(p, "s3_05_fila_pendente.png")
        antes = dev("/api/m/atendimentos?chave=" + chave)["atendimentos"]
        print("no servidor antes de voltar o sinal:", len(antes))
        # 4) sinal volta: envio automático
        ctx.set_offline(False)
        p.wait_for_selector("text=Nenhum atendimento esperando envio", timeout=15000)
        foto(p, "s3_06_sinal_voltou_enviado.png")
        depois = dev("/api/m/atendimentos?chave=" + chave)["atendimentos"]
        print("no servidor depois:", len(depois), json.dumps(depois[0], ensure_ascii=False)[:400])
        assert len(antes) == 0 and len(depois) == 1 and depois[0]["fotos"] and depois[0]["lat"] and depois[0]["offline"]
    if ETAPA == "s4":
        import json
        import urllib.request
        entrar(p)
        tok = p.evaluate("JSON.parse(localStorage.getItem('fibracampo.token'))")
        def dev(caminho, corpo=None):
            r = urllib.request.Request(URL.replace("/app/", caminho), data=json.dumps(corpo).encode() if corpo is not None else None,
                                       headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"})
            return json.loads(urllib.request.urlopen(r).read())
        p.click("nav button:has-text('Conta')")
        p.wait_for_selector("button:has-text('avisos de pontos críticos')")
        if p.is_visible("button:has-text('🔔 Ligar')"):
            p.click("button:has-text('🔔 Ligar')")
        p.wait_for_selector("button:has-text('Desligar avisos')")
        foto(p, "s4_01_conta_avisos_ligados.png")
        samu = next(x for x in dev("/api/m/pontos")["pontos"] if "SAMU" in x["nome"])
        if samu["status"] == "OFFLINE":                        # garante o cenário: SAMU estava online...
            dev("/dev/alternar", {"chave": samu["chave"]})
            dev("/api/m/pontos")
        dev("/dev/alternar", {"chave": samu["chave"]})        # ...e cai agora
        p.reload()
        p.wait_for_selector(".toast", timeout=15000)
        p.wait_for_timeout(1500)
        notifs = p.evaluate("navigator.serviceWorker.ready.then(r => r.getNotifications()).then(ns => ns.map(n => n.title + ' | ' + n.body))")
        print("notificações do sistema:", notifs)
        foto(p, "s4_02_aviso_queda_samu.png")
        p.goto(URL + "#/historico/" + samu["chave"])
        p.wait_for_selector(".atend")
        p.wait_for_timeout(800)
        foto(p, "s4_03_historico_atendimentos.png")
        assert any("SAMU" in n for n in notifs)
    if ETAPA == "s5":
        # Sprint 3 (15/11/2026): CA05 (pendente sobrevive a fechar e reabrir sem sinal), CA07 (US11, saída com
        # pendentes e outra conta) e CA09 parcial (tablet emulado).
        entrar(p)
        p.goto(URL + "#/ponto/ONU%3A1")
        p.click("button:has-text('📝 Registrar')")
        p.wait_for_selector("text=Localização registrada")
        ctx.set_offline(True)
        p.select_option("select", index=2)
        p.fill("textarea", "Limpeza do conector. Teste de persistência (CA05) e de saída com pendente (CA07).")
        p.set_input_files("input[type=file]", os.path.join(os.path.dirname(SAIDA), "foto_teste.jpg"))
        p.wait_for_selector(".fotos .mini")
        p.click("button:has-text('Salvar atendimento')")
        p.wait_for_selector(".toast")
        p.close()                                            # fecha o app sem sinal
        p = ctx.new_page()                                   # e reabre
        p.goto(URL + "#/pendentes")
        p.wait_for_selector(".atend")
        foto(p, "s5_01_reaberto_sem_sinal_pendente.png")
        n1 = p.locator(".atend").count()
        p.click("nav button:has-text('Conta')")
        p.click("button:has-text('Sair da conta')")
        p.wait_for_selector("[role=alertdialog]")
        foto(p, "s5_02_aviso_sair_com_pendente.png")
        p.click("button:has-text('Sair mesmo assim')")
        p.wait_for_selector("form.login")
        ctx.set_offline(False)
        p.fill("input[autocomplete=username]", "suporte")
        p.fill("input[type=password]", "suporte123")
        p.click("button.bt")
        p.wait_for_selector(".topo")
        p.click("nav button:has-text('Envios')")
        p.wait_for_selector("text=Nenhum atendimento esperando envio")
        foto(p, "s5_03_outra_conta_nao_ve.png")
        p.click("nav button:has-text('Conta')")
        p.click("button:has-text('Sair da conta')")
        p.wait_for_selector("form.login")
        entrar(p)
        p.wait_for_selector("text=atendimento(s) pendente(s) enviado(s)", timeout=20000)
        foto(p, "s5_04_tecnico_volta_enviado.png")
        print("pendentes após reabrir:", n1)
        tab = nav.new_context(**pw.devices["Galaxy Tab S4"], locale="pt-BR", timezone_id="America/Sao_Paulo",
                              geolocation={"latitude": -16.3401, "longitude": -48.9502}, permissions=["geolocation"])
        t = tab.new_page(); p = t
        entrar(p); p.wait_for_selector(".lista .ponto")
        foto(p, "s5_05_tablet_inicio.png")
        largura = p.evaluate("[document.documentElement.scrollWidth, innerWidth]")
        print("tablet scrollWidth/innerWidth:", largura)
        assert n1 == 1
    nav.close()
