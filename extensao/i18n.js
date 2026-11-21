// Traduções das páginas. Os textos ficam em _locales/<idioma>/messages.json (os mesmos arquivos
// que o Edge usa para o nome e a descrição do manifest). Não usamos chrome.i18n.getMessage nas
// páginas porque ele só segue o idioma do Edge; aqui o usuário pode escolher outro nas opções.
"use strict";

(function (raiz) {
  const IDIOMAS = ["en", "pt_BR"];
  const PADRAO = "en";

  // "auto" (ou valor desconhecido) segue o idioma do Edge: português -> pt_BR, o resto -> inglês.
  function resolverIdioma(escolhido, idiomaDoNavegador) {
    if (IDIOMAS.includes(escolhido)) return escolhido;
    return /^pt\b/i.test(idiomaDoNavegador || "") ? "pt_BR" : PADRAO;
  }

  // Monta o texto: procura no idioma escolhido, cai no padrão e, por fim, na própria chave.
  // "$1".."$9" são trocados pelos argumentos.
  function formatar(mensagens, reserva, chave, args) {
    const m = mensagens?.[chave]?.message ?? reserva?.[chave]?.message ?? chave;
    return m.replace(/\$(\d)/g, (_, n) => String(args[n - 1] ?? ""));
  }

  // Traduz um erro {chave, args} vindo de config.js; args também podem ser erros (aninhados).
  function traduzirErro(t, erro) {
    const args = erro.args.map((a) => (a && typeof a === "object" ? traduzirErro(t, a) : a));
    return t(erro.chave, ...args);
  }

  async function lerMensagens(idioma) {
    const resposta = await fetch(chrome.runtime.getURL(`_locales/${idioma}/messages.json`));
    return resposta.json();
  }

  // Retorna t(chave, ...args) com t.idioma = "en" | "pt_BR".
  async function carregar(escolhido) {
    const idioma = resolverIdioma(escolhido, chrome.i18n.getUILanguage());
    const [reserva, mensagens] = await Promise.all([
      lerMensagens(PADRAO),
      idioma === PADRAO ? null : lerMensagens(idioma),
    ]);
    const t = (chave, ...args) => formatar(mensagens, reserva, chave, args);
    t.idioma = idioma;
    return t;
  }

  // Aplica os textos aos elementos marcados com data-i18n* na página.
  // data-i18n-html só é usado com textos do próprio pacote (têm <code>/<strong>), nunca com
  // texto digitado pelo usuário.
  function aplicar(t) {
    document.documentElement.lang = t.idioma.replace("_", "-");
    for (const el of document.querySelectorAll("[data-i18n]")) {
      el.textContent = t(el.dataset.i18n);
    }
    for (const el of document.querySelectorAll("[data-i18n-html]")) {
      el.innerHTML = t(el.dataset.i18nHtml);
    }
    for (const el of document.querySelectorAll("[data-i18n-title]")) {
      el.title = t(el.dataset.i18nTitle);
    }
    for (const el of document.querySelectorAll("[data-i18n-placeholder]")) {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    }
  }

  const api = { IDIOMAS, resolverIdioma, formatar, traduzirErro, carregar, aplicar };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.NovaGuiaI18n = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
