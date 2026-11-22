# LF Tools

Extensão para o Google Chrome que adiciona ao menu de contexto (botão direito) uma ferramenta rápida para **codificar e decodificar Base64**, sem sair da página em que você está.

**Versão publicada na Chrome Web Store:** https://chromewebstore.google.com/detail/lf-tools/iaaajolpblfglocajkbnecnncofbifan

## Como usar

1. Selecione um texto em qualquer página (ou apenas copie-o para a área de transferência).
2. Clique com o botão direito e escolha **LF Tools Base64**.
3. Uma janela flutuante se abre com o texto no campo de entrada e o resultado já calculado no campo de saída.

Se nenhum texto estiver selecionado, a extensão preenche a entrada com o conteúdo da área de transferência.

## Funcionalidades

- **Decode:** decodifica Base64 para texto (UTF-8).
- **Encode:** codifica texto para Base64, com suporte completo a acentos e caracteres especiais.
- **Decode to JSON:** decodifica e exibe o JSON como uma árvore formatada, com nós que podem ser expandidos e recolhidos.
- **Base64URL:** aceita o formato seguro para URLs (`-` e `_`) e entradas sem o preenchimento `=`.
- **JWT:** ao colar um token JWT (`header.payload.assinatura`), exibe o header e o payload decodificados.
- **Atualização em tempo real:** o resultado é recalculado enquanto você digita.
- **Mensagens de erro claras:** avisa quando a entrada não é Base64 válido ou quando o conteúdo decodificado não é texto (dados binários).
- **Janela ajustável:** arraste pelo título, redimensione pelas bordas e ajuste a divisão entre entrada e saída.
- **Isolada da página:** o visual da janela não é afetado pelo CSS do site, e as teclas digitadas nela não acionam atalhos da página.
- **Funciona em páginas restritas:** em páginas como `chrome://`, Chrome Web Store ou no visualizador de PDF, a ferramenta abre em uma janela própria.

Para fechar, use o botão **×**, a tecla **Esc** ou clique fora da janela.

## Instalação para desenvolvimento

1. Clone este repositório.
2. Acesse `chrome://extensions` e ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e selecione a pasta do repositório.

## Estrutura

| Arquivo | Descrição |
| --- | --- |
| `manifest.json` | Configuração da extensão (Manifest V3). |
| `background.js` | Service worker: cria o menu de contexto e abre a ferramenta na página. |
| `ui.js` | Interface da janela flutuante e lógica de codificação/decodificação. |
| `fallback.html` / `fallback.js` | Janela própria usada em páginas onde não é possível injetar a interface. |
