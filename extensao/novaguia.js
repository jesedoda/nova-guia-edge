// Página que substitui a nova guia: escolhe a URL e abre do jeito configurado.
"use strict";

const $ = (id) => document.getElementById(id);

function mostrarAviso({ titulo, texto, links = [], tentar = false }) {
  $("aviso-titulo").textContent = titulo;
  $("aviso-texto").textContent = texto;
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
async function abrir(url, modo) {
  if (modo === "aba") {
    const aba = await chrome.tabs.getCurrent();
    if (aba) {
      await chrome.tabs.update(aba.id, { url });
      return;
    }
  }
  if (modo === "moldura") {
    const moldura = $("moldura");
    moldura.src = url;
    moldura.hidden = false;
    const sair = $("sair-moldura");
    sair.href = url;
    sair.hidden = false;
    document.body.classList.add("com-moldura");
    return;
  }
  location.replace(url);
}

async function iniciar() {
  $("abrir-opcoes").addEventListener("click", () => chrome.runtime.openOptionsPage());
  $("tentar").addEventListener("click", () => location.reload());

  const config = await NovaGuia.carregar();
  const { indiceRotacao } = await chrome.storage.local.get("indiceRotacao");
  const escolha = NovaGuia.escolherUrl(config, indiceRotacao);

  if (!escolha) {
    mostrarAviso({
      titulo: "Nenhuma URL configurada",
      texto: "Escolha qual página deve abrir em cada nova guia.",
    });
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
      mostrarAviso({
        titulo: "Sem conexão",
        texto: "O navegador está offline. Quando a conexão voltar, tente de novo.",
        links: config.urls,
        tentar: true,
      });
      window.addEventListener("online", () => location.reload(), { once: true });
      return;
    }
  }

  // Arquivos locais exigem "Permitir acesso a URLs de arquivo" em edge://extensions.
  if (url.startsWith("file:") && !(await chrome.extension.isAllowedFileSchemeAccess())) {
    mostrarAviso({
      titulo: "Falta permissão para arquivos locais",
      texto:
        'Em edge://extensions, abra "Detalhes" desta extensão e ative ' +
        '"Permitir acesso a URLs de arquivo". Depois tente de novo.',
      tentar: true,
    });
    return;
  }

  await abrir(url, config.abertura);
}

iniciar().catch((erro) => {
  console.error(erro);
  mostrarAviso({ titulo: "Erro ao abrir a nova guia", texto: String(erro) });
});
