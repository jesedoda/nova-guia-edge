# Nova Guia com URL (Microsoft Edge)

Extensão própria para o Edge (Manifest V3) que abre a URL que você escolher em cada nova guia.
Inspirada na [simple-new-tab-url](https://github.com/zach-adams/simple-new-tab-url), reescrita
do zero para não depender de repositório alheio.

## O Edge já faz isso sozinho?

Não, pelo menos não em um PC pessoal:

- Em **Configurações › Início, página inicial e nova guia** dá para escolher o que abre na
  **inicialização** e para onde vai o **botão Início**. A **nova guia** só deixa personalizar a página
  da Microsoft (layout, conteúdo, plano de fundo). Não existe campo para trocar a nova guia por uma URL.
- A política de grupo **`NewTabPageLocation`** faz exatamente isso
  (`HKLM\SOFTWARE\Policies\Microsoft\Edge`, valor `REG_SZ`), mas a documentação da Microsoft diz que no
  Windows ela só vale em máquinas ingressadas em domínio do Active Directory, no Azure AD/Entra ID ou
  inscritas em gerenciamento (MDM). Em um Windows 11 Home pessoal o Edge ignora a chave. Também não se
  aplica a perfis conectados com conta Microsoft pessoal.
- Por isso a saída é uma extensão que usa `chrome_url_overrides.newtab`.

## Como instalar (sem loja)

1. Abra `edge://extensions`.
2. Ative **Modo de desenvolvedor** (canto inferior esquerdo).
3. Clique em **Carregar sem pacote** e escolha a pasta `extensao/` deste repositório.
4. A página de opções abre sozinha: informe a URL e clique em **Salvar**.
5. Na primeira nova guia, o Edge pergunta se você quer manter a alteração feita pela extensão.
   Clique em **Manter alterações** (se clicar em "Alterar de volta", o Edge desativa a extensão).
6. Desative a outra extensão de nova guia, se houver. Só uma pode controlar a nova guia por vez.

Para abrir as opções depois, clique no ícone da extensão na barra (ou em *Detalhes › Opções da
extensão*). Depois de alterar o código, clique em **Recarregar** no cartão da extensão em
`edge://extensions`.

> Extensões carregadas sem pacote continuam funcionando, mas o Edge pode mostrar de vez em quando um
> aviso sobre extensões no modo de desenvolvedor. Para evitar isso, seria preciso publicar na loja de
> complementos do Edge.

## O que ela faz

| Recurso | Detalhe |
|---|---|
| Validação | Aceita `github.com` (vira `https://github.com/`), `localhost:8000` e `C:\pasta\x.html` (vira `file:///`). Recusa `javascript:`, `data:` e o que não parecer endereço. |
| Várias URLs | Uma por linha: usar sempre a primeira, revezar uma por guia ou sortear. |
| Três modos de abertura | **Redirecionar** (`location.replace`, padrão), **Navegar pela guia** (`chrome.tabs.update`) e **Moldura** (iframe, mantém o foco na barra de endereço). |
| Sem conexão | Se o navegador estiver offline, abre a URL reserva (ex.: um HTML local) ou mostra a lista de links e recarrega sozinha quando a conexão volta. |
| Arquivos locais | Avisa quando falta ativar **Permitir acesso a URLs de arquivo** nos detalhes da extensão. |
| Sincronização | Opcional, via `chrome.storage.sync` (sincroniza entre PCs com o mesmo perfil). Desmarcada, cada PC tem a própria configuração. |
| Permissões | Só `storage`. Não lê seu histórico nem as páginas que você visita. |
| Tema | Segue claro/escuro do sistema, para não piscar branco antes da página carregar. |

Configuração por perfil: cada perfil do Edge tem sua própria instância da extensão. Com a sincronização
ligada, perfis com contas diferentes já ficam separados. Para dois perfis na mesma conta com URLs
diferentes, desmarque a sincronização em um deles.

### Sobre os modos de abertura

Nenhuma extensão consegue fazer a nova guia ser "a própria URL". Ela sempre abre primeiro a página da
extensão (`chrome-extension://…/novaguia.html`) e depois vai para o destino. Cada modo tem um custo:

- **Redirecionar:** funciona com qualquer site. O cursor vai para a página, não para a barra de
  endereço, e o "Voltar" não volta para a nova guia.
- **Navegar pela guia:** a navegação é feita pelo navegador, como se você tivesse digitado o endereço.
  Teste se o comportamento do foco e do "Voltar" te agrada mais que o anterior.
- **Moldura:** a barra de endereço continua vazia e focada, então dá para começar a digitar uma busca
  direto. Mas muitos sites (Google, GitHub, bancos…) proíbem ser exibidos em iframe e aparecem em
  branco/erro, e logins podem falhar porque os cookies viram "de terceiros". Funciona bem com páginas
  suas, um painel local (`http://localhost:...`) ou um arquivo HTML. O botão ↗ no canto abre a página
  de verdade.

## Como a extensão de referência funciona (simple-new-tab-url)

- `manifest.json`: MV3, `chrome_url_overrides.newtab = redirect.html`, permissão `storage`, página de
  opções e um `blank.html` exposto como recurso acessível na web (sobra de versões antigas, não é usado).
- `redirect.js`: lê `url`, `sync` e `highlight` de `chrome.storage.local`. Com `sync` ligado, lê a URL
  de `chrome.storage.sync`. Sem URL, abre as opções. Para `file://`, checa
  `chrome.extension.isAllowedFileSchemeAccess`. No caso normal faz `document.location = url`. Com
  "highlight", usa `chrome.tabs.update(..., {url, highlighted: true})`, mas passa o array de
  `tabs.query` como se fosse uma guia (`tab.id` fica `undefined`), então só funciona porque
  `update(undefined)` cai na guia ativa.
- `options.js`: salva a cada tecla (sem validar nada) em `local` e, se marcado, em `sync`.
- Limitações: o foco fica na página e não na barra de endereço; aparece um flash da página da
  extensão; a URL `chrome-extension://` aparece rapidamente; aceita qualquer texto como URL; só uma URL.

## Estrutura

```
extensao/
  manifest.json   permissões e override da nova guia
  config.js       validação, escolha da URL e leitura/gravação no chrome.storage
  novaguia.html/js  página da nova guia (redireciona, navega ou mostra em moldura)
  opcoes.html/js  página de opções
  fundo.js        service worker: abre as opções na instalação e no clique do ícone
  estilo.css
  icones/
testes/
  config.test.js  testes das funções puras
```

## Testes

Com Node 18+:

```
node --test testes/config.test.js
```
