// Lógica compartilhada entre a nova guia, a página de opções e os testes.
// Funções puras ficam aqui; o acesso a chrome.storage fica em carregar/salvar.
"use strict";

(function (raiz) {
  const PADRAO = Object.freeze({
    urls: [], // lista de URLs já validadas
    escolha: "primeira", // "primeira" | "rotacao" | "aleatoria"
    abertura: "substituir", // "substituir" | "aba" | "moldura"
    reserva: "", // URL usada quando o navegador está offline ("" = página interna)
    idioma: "auto", // "auto" (idioma do Edge) | "en" | "pt_BR"
  });

  const ESCOLHAS = ["primeira", "rotacao", "aleatoria"];
  const IDIOMAS = ["auto", "en", "pt_BR"];
  const ABERTURAS = ["substituir", "aba", "moldura"];
  const PROTOCOLOS = ["http:", "https:", "file:"];

  // Valida e normaliza o texto digitado. "exemplo.com" vira "https://exemplo.com/".
  // Retorna {ok: true, url} ou {ok: false, erro: {chave, args}}; a chave é traduzida em
  // _locales/*/messages.json.
  function normalizarUrl(texto) {
    const t = String(texto ?? "").trim();
    if (!t) return { ok: false, erro: { chave: "erroUrlVazia", args: [] } };
    let candidato = t;
    if (/^[a-z]:[\\/]/i.test(t)) {
      // Caminho do Windows (C:\pasta\x.html): antes do teste de esquema, senão "c:" vira esquema.
      candidato = "file:///" + t.replace(/\\/g, "/");
    } else if (!/^[a-z][a-z0-9+.-]*:/i.test(t) || /^localhost:\d/i.test(t)) {
      // Sem esquema: aceita "dominio.tld/..." e "localhost:porta".
      candidato = "https://" + t;
    }
    let u;
    try {
      u = new URL(candidato);
    } catch {
      return { ok: false, erro: { chave: "erroUrlInvalida", args: [t] } };
    }
    if (!PROTOCOLOS.includes(u.protocol)) {
      return { ok: false, erro: { chave: "erroEsquema", args: [u.protocol] } };
    }
    if (u.protocol !== "file:") {
      const host = u.hostname;
      const pareceHost =
        host === "localhost" || host.includes(".") || host.startsWith("[") || /^\d+$/.test(host);
      if (!pareceHost) return { ok: false, erro: { chave: "erroNaoEndereco", args: [host] } };
    }
    return { ok: true, url: u.href };
  }

  // Lê o textarea (uma URL por linha; linhas vazias e "# comentário" são ignoradas).
  function lerLista(texto) {
    const urls = [];
    const erros = [];
    String(texto ?? "")
      .split(/\r?\n/)
      .forEach((linha, i) => {
        const l = linha.trim();
        if (!l || l.startsWith("#")) return;
        const r = normalizarUrl(l);
        if (r.ok) {
          if (!urls.includes(r.url)) urls.push(r.url);
        } else {
          erros.push({ chave: "erroLinha", args: [i + 1, r.erro] });
        }
      });
    return { urls, erros };
  }

  // Completa e saneia configurações vindas do armazenamento (podem ser antigas ou inválidas).
  function sanear(bruto) {
    const c = { ...PADRAO, ...(bruto && typeof bruto === "object" ? bruto : {}) };
    c.urls = Array.isArray(c.urls)
      ? c.urls.map(normalizarUrl).filter((r) => r.ok).map((r) => r.url)
      : [];
    if (!ESCOLHAS.includes(c.escolha)) c.escolha = PADRAO.escolha;
    if (!ABERTURAS.includes(c.abertura)) c.abertura = PADRAO.abertura;
    if (!IDIOMAS.includes(c.idioma)) c.idioma = PADRAO.idioma;
    const reserva = c.reserva ? normalizarUrl(c.reserva) : null;
    c.reserva = reserva && reserva.ok ? reserva.url : "";
    return c;
  }

  // Escolhe a URL da vez. `indice` é o contador de rotação; `sorteio` ∈ [0,1).
  // Retorna {url, proximoIndice} ou null quando não há URL configurada.
  function escolherUrl(config, indice, sorteio) {
    const urls = config.urls;
    if (!urls.length) return null;
    const i = Number.isInteger(indice) && indice >= 0 ? indice : 0;
    if (config.escolha === "rotacao") {
      return { url: urls[i % urls.length], proximoIndice: (i + 1) % urls.length };
    }
    if (config.escolha === "aleatoria") {
      const s = typeof sorteio === "number" ? sorteio : Math.random();
      return { url: urls[Math.floor(s * urls.length) % urls.length], proximoIndice: i };
    }
    return { url: urls[0], proximoIndice: i };
  }

  // --- Armazenamento -------------------------------------------------------
  // "usarSync" fica sempre no local (é por dispositivo). As configurações ficam
  // no sync (sincronizadas pela conta Microsoft do perfil) ou no local.
  // O índice da rotação fica sempre no local para não gerar escrita no sync a cada guia.

  async function areaAtual() {
    const { usarSync = true } = await chrome.storage.local.get("usarSync");
    return usarSync ? chrome.storage.sync : chrome.storage.local;
  }

  async function carregar() {
    const area = await areaAtual();
    const { config } = await area.get("config");
    return sanear(config);
  }

  async function salvar(config) {
    const area = await areaAtual();
    await area.set({ config: sanear(config) });
  }

  const api = {
    PADRAO,
    ESCOLHAS,
    ABERTURAS,
    IDIOMAS,
    normalizarUrl,
    lerLista,
    sanear,
    escolherUrl,
    areaAtual,
    carregar,
    salvar,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.NovaGuia = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
