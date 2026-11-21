<p align="center">
  <img src="extensao/icones/128.png" width="96" alt="Ícone da extensão">
</p>

<h1 align="center">Nova Guia com URL</h1>

<p align="center">
  Escolha a página que abre em cada nova guia do Microsoft Edge.<br>
  Leve, sem rastreamento e com uma única permissão.
</p>

<p align="center">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-0f6cbd">
  <img alt="Microsoft Edge" src="https://img.shields.io/badge/Microsoft%20Edge-102%2B-0f6cbd">
  <img alt="Permissões" src="https://img.shields.io/badge/permiss%C3%B5es-storage-2ea44f">
</p>

---

## O problema

O Edge deixa você escolher a página de **inicialização** e a do **botão Início**, mas não a da
**nova guia**: lá só dá para mudar o layout da página da Microsoft. A única forma nativa de trocar a
nova guia por um endereço é a política `NewTabPageLocation`, que só funciona em computadores
gerenciados por empresa (domínio, Entra ID ou MDM).

**Nova Guia com URL** resolve isso: toda nova guia abre o site que você escolher, seja o seu buscador,
um painel, o e-mail ou um arquivo HTML do seu computador.

## Recursos

- **Qualquer endereço.** Sites, `localhost` ou arquivos locais. Digite `github.com` e a extensão
  completa para `https://github.com/`.
- **Várias páginas.** Use sempre a mesma, reveze uma por guia ou sorteie.
- **Três modos de abertura.** Redirecionamento comum, navegação pela própria guia ou moldura, que
  mantém o cursor na barra de endereço.
- **Funciona offline.** Sem conexão, abre uma página reserva ou mostra seus links e recarrega quando a
  internet voltar.
- **Sincronização opcional.** Leve a configuração para outros computadores com a conta do Edge, ou
  mantenha uma configuração por computador.
- **Tema claro e escuro.** Segue o sistema, sem tela branca piscando.
- **Português e inglês.** Segue o idioma do Edge, ou escolha um nas opções.

## Privacidade

A extensão pede apenas a permissão `storage`, usada para guardar as suas configurações. Ela não lê o
seu histórico nem as páginas que você visita, não envia dados para nenhum servidor e não carrega
código remoto.

## Instalação

1. Baixe ou clone este repositório.
2. Abra `edge://extensions` e ative **Modo de desenvolvedor**.
3. Clique em **Carregar sem pacote** e selecione a pasta `extensao/`.
4. Na página de opções que se abre, informe a URL e clique em **Salvar**.
5. Na primeira nova guia, o Edge pergunta se você quer manter a alteração: clique em
   **Manter alterações**.

> Só uma extensão pode controlar a nova guia por vez. Desative outras extensões de nova guia que
> estiverem instaladas.

## Uso

Clique no ícone da extensão na barra de ferramentas para abrir as opções.

| Opção | O que faz |
|---|---|
| Páginas | Uma URL por linha. Linhas iniciadas com `#` são ignoradas. |
| Com mais de uma URL | Sempre a primeira, revezar ou sortear. |
| Como abrir | **Redirecionar**: funciona com qualquer site.<br>**Navegar pela guia**: o navegador faz a navegação, como se você tivesse digitado o endereço.<br>**Moldura**: o cursor fica na barra de endereço, mas muitos sites não permitem ser exibidos assim. Ideal para páginas próprias e arquivos locais. |
| Sem conexão | Página aberta quando o navegador está offline. |
| Sincronização | Liga ou desliga a sincronização das opções com a conta do Edge. |
| Idioma | Automático (idioma do Edge), English ou Português (Brasil). |

**Arquivos locais:** para abrir arquivos `file://`, ative **Permitir acesso a URLs de arquivo** em
`edge://extensions` › *Detalhes* da extensão.

## Limitações

Por regra do navegador, nenhuma extensão consegue fazer a nova guia *ser* o próprio site. A guia
sempre abre primeiro a página da extensão e então vai para o destino, por isso o endereço
`chrome-extension://` pode aparecer por um instante.

## Desenvolvimento

```
extensao/
├── manifest.json     # override da nova guia e permissões
├── config.js         # validação, escolha da URL e armazenamento
├── i18n.js           # tradução das páginas (lê _locales/)
├── _locales/         # textos em inglês (en) e português (pt_BR)
├── novaguia.html/js  # página da nova guia
├── opcoes.html/js    # página de opções
├── fundo.js          # service worker (abre as opções)
├── estilo.css
└── icones/
testes/
├── config.test.js
└── i18n.test.js
```

Testes (Node 18 ou superior):

```
node --test testes/config.test.js testes/i18n.test.js
```

Depois de alterar o código, clique em **Recarregar** no cartão da extensão em `edge://extensions`.
