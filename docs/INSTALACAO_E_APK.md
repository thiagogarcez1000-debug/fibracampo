# Instalação do FibraCampo

## 1. No servidor (computador do Gerenciador de ONUs)
1. Feche o Gerenciador.
2. Copie `api/api_mobile.py` e `api/instalar_api_mobile.py` para a pasta do Gerenciador.
3. Na pasta do Gerenciador, rode: `python instalar_api_mobile.py`
   (ele faz backup do `noc.py` como `noc_antes_mobile_AAAAMMDD_HHMM.py` antes de mudar qualquer coisa;
   `python instalar_api_mobile.py --checar` só mostra o que falta).
4. Copie o **conteúdo** da pasta `app/dist` para uma pasta `app_mobile` dentro da pasta do Gerenciador
   (ou rode `api/PUBLICAR_APP.bat`, que faz a cópia).
5. Abra o Gerenciador normalmente. Teste no navegador do PC: `http://localhost:8770/app/`.

Para desfazer: feche o Gerenciador e volte o backup `noc_antes_mobile_...py` para `noc.py`.

## 2. No celular (Android 8 ou superior, Chrome)
1. Conecte o celular na rede da Prefeitura ou ligue a VPN (Tailscale).
2. Abra no Chrome o endereço do servidor + `/app/` (ex.: `http://<servidor>:8770/app/` ou o link externo com HTTPS).
3. Entre com o usuário do sistema.
4. Em **Conta**, toque em **Instalar o FibraCampo no celular** (ou menu ⋮ → *Adicionar à tela inicial*).
5. Ainda em **Conta**, toque em **Ligar avisos de pontos críticos** e permita as notificações.

> Câmera, GPS, notificações e instalação exigem HTTPS (ou o endereço `localhost`).
> Pelo IP interno (`http://`) o app abre, lista e testa os pontos, mas o Chrome bloqueia câmera/GPS/avisos.
> Por isso a instalação na equipe deve ser feita pelo **link externo com HTTPS** (Cloudflare) ou por
> um certificado interno.

## 3. Gerar o APK (opcional, para instalar sem abrir o navegador)
1. Com o app publicado em um endereço **HTTPS**, abra https://www.pwabuilder.com e cole o endereço `/app/`.
2. Clique em *Package for stores* → **Android** → *Generate* (opção "Other Android" para APK de instalação direta).
3. Baixe o `.zip`: dentro dele vem o `app-release-signed.apk` e a chave de assinatura (**guarde a chave**:
   ela é necessária para gerar as próximas versões).
4. Envie o APK para os celulares da equipe e instale (permitir "instalar apps desconhecidos" para o gerenciador de arquivos).

Alternativa sem site externo: Bubblewrap (`npm i -g @bubblewrap/cli`, `bubblewrap init --manifest=<url>/app/manifest.webmanifest`, `bubblewrap build`) — precisa do JDK e do Android SDK no PC.
