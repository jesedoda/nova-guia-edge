// Página que substitui a nova guia: escolhe a URL e abre do jeito configurado.
"use strict";

const $ = (id) => document.getElementById(id);

// Traduz a página só quando ela vai aparecer (aviso ou moldura); no redirecionamento comum
// não carregamos os textos, para não atrasar a navegação.
async function traduzir(idioma) {
  const t = await NovaGuiaI18n.carregar(idioma);
  NovaGuiaI18n.aplicar(t);
  return t;
}

async function mostrarAviso(idioma, { titulo, texto, textoLivre, links = [], tentar = false }) {
  const t = await traduzir(idioma);
  $("aviso-titulo").textContent = t(titulo);
  $("aviso-texto").textContent = textoLivre ?? (texto ? t(texto) : "");
  const lista = $("aviso-links");
  lista.replaceChildren(
    ...links.map((url) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = url;
      a.textContent = url;
      li.append(a);
      return li;
    }),
  );
  $("tentar").hidden = !tentar;
  $("aviso").hidden = false;
}

// Abre a URL conforme o modo:
// - substituir: location.replace (não deixa a nova guia no histórico do "Voltar");
// - aba: chrome.tabs.update (navegação feita pelo navegador; o endereço aparece na barra);
// - moldura: carrega num iframe e o foco continua na barra de endereço.
async function abrir(url, config) {
  if (config.abertura === "aba") {
    const aba = await chrome.tabs.getCurrent();
    if (aba) {
      await chrome.tabs.update(aba.id, { url });
      return;
    }
  }
  if (config.abertura === "moldura") {
    const moldura = $("moldura");
    moldura.src = url;
    moldura.hidden = false;
    const sair = $("sair-moldura");
    sair.href = url;
    sair.hidden = false;
    document.body.classList.add("com-moldura");
    await traduzir(config.idioma);
    return;
  }
  location.replace(url);
}

async function iniciar(config) {
  const { indiceRotacao } = await chrome.storage.local.get("indiceRotacao");
  const escolha = NovaGuia.escolherUrl(config, indiceRotacao);

  if (!escolha) {
    await mostrarAviso(config.idioma, { titulo: "semUrlTitulo", texto: "semUrlTexto" });
    return;
  }
  if (escolha.proximoIndice !== indiceRotacao) {
    await chrome.storage.local.set({ indiceRotacao: escolha.proximoIndice });
  }

  let url = escolha.url;

  // Offline: usa a URL reserva (ex.: um arquivo local) ou mostra a lista para tentar depois.
  if (!navigator.onLine && !url.startsWith("file:")) {
    if (config.reserva) {
      url = config.reserva;
    } else {
      window.addEventListener("online", () => location.reload(), { once: true });
      await mostrarAviso(config.idioma, {
        titulo: "offlineTitulo",
        texto: "offlineTexto",
        links: config.urls,
        tentar: true,
      });
      return;
    }
  }

  // Arquivos locais exigem "Permitir acesso a URLs de arquivo" em edge://extensions.
  if (url.startsWith("file:") && !(await chrome.extension.isAllowedFileSchemeAccess())) {
    await mostrarAviso(config.idioma, {
      titulo: "arquivoTitulo",
      texto: "arquivoTexto",
      tentar: true,
    });
    return;
  }

  await abrir(url, config);
}

$("abrir-opcoes").addEventListener("click", () => chrome.runtime.openOptionsPage());
$("tentar").addEventListener("click", () => location.reload());

let config = NovaGuia.sanear(null);
NovaGuia.carregar()
  .then((c) => iniciar((config = c)))
  .catch((erro) => {
    console.error(erro);
    mostrarAviso(config.idioma, { titulo: "erroTitulo", textoLivre: String(erro) });
  });
