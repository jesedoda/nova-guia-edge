// Página de opções: lê, valida e salva as configurações.
"use strict";

const $ = (id) => document.getElementById(id);
const form = $("form");

let t = null; // tradutor atual (NovaGuiaI18n.carregar)
let errosAtuais = []; // erros {chave, args}, guardados para retraduzir ao trocar o idioma

function marcar(nome, valor) {
  const radio = form.querySelector(`input[name="${nome}"][value="${valor}"]`);
  if (radio) radio.checked = true;
}

function valorMarcado(nome) {
  return form.querySelector(`input[name="${nome}"]:checked`)?.value;
}

async function traduzir(idioma) {
  t = await NovaGuiaI18n.carregar(idioma);
  NovaGuiaI18n.aplicar(t);
  mostrarErros(errosAtuais);
  document.body.classList.remove("carregando");
}

async function preencher() {
  const config = await NovaGuia.carregar();
  const { usarSync = true } = await chrome.storage.local.get("usarSync");
  $("urls").value = config.urls.join("\n");
  $("reserva").value = config.reserva;
  $("usarSync").checked = usarSync;
  $("idioma").value = config.idioma;
  marcar("escolha", config.escolha);
  marcar("abertura", config.abertura);
  await traduzir(config.idioma);
  await avisarArquivo(config);
}

async function avisarArquivo(config) {
  const temArquivo = [...config.urls, config.reserva].some((u) => u.startsWith("file:"));
  const permitido = temArquivo && (await chrome.extension.isAllowedFileSchemeAccess());
  $("aviso-arquivo").hidden = !temArquivo || permitido;
}

function mostrarErros(erros) {
  errosAtuais = erros;
  const caixa = $("erros");
  caixa.replaceChildren(
    ...erros.map((e) => {
      const p = document.createElement("p");
      p.textContent = NovaGuiaI18n.traduzirErro(t, e);
      return p;
    }),
  );
  caixa.hidden = erros.length === 0;
}

function status(chave) {
  $("status").textContent = chave ? t(chave) : "";
  if (chave) setTimeout(() => ($("status").textContent = ""), 2500);
}

// Valida o formulário. Retorna a configuração ou null (com os erros na tela).
function lerFormulario() {
  const { urls, erros } = NovaGuia.lerLista($("urls").value);
  const textoReserva = $("reserva").value.trim();
  let reserva = "";
  if (textoReserva) {
    const r = NovaGuia.normalizarUrl(textoReserva);
    if (r.ok) reserva = r.url;
    else erros.push({ chave: "erroReserva", args: [r.erro] });
  }
  if (!urls.length && !erros.length) erros.push({ chave: "erroNenhumaUrl", args: [] });
  mostrarErros(erros);
  if (erros.length) return null;
  return {
    urls,
    reserva,
    escolha: valorMarcado("escolha"),
    abertura: valorMarcado("abertura"),
    idioma: $("idioma").value,
  };
}

async function salvar() {
  const config = lerFormulario();
  if (!config) return false;

  // Trocar a sincronização copia a configuração para a nova área.
  const usarSync = $("usarSync").checked;
  await chrome.storage.local.set({ usarSync });
  await NovaGuia.salvar(config);
  await chrome.storage.local.set({ indiceRotacao: 0 });

  // Mostra o texto já normalizado (ex.: "github.com" -> "https://github.com/").
  $("urls").value = config.urls.join("\n");
  $("reserva").value = config.reserva;
  await avisarArquivo(config);
  status("salvo");
  return true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  await salvar();
});

$("testar").addEventListener("click", async () => {
  if (await salvar()) chrome.tabs.create({});
});

// Trocar o idioma já mostra a página traduzida; fica gravado ao salvar.
$("idioma").addEventListener("change", () => traduzir($("idioma").value));

// Atualiza a tela se a configuração mudar em outro lugar (outra janela ou sincronização).
chrome.storage.onChanged.addListener((mudancas) => {
  if (mudancas.config && !form.contains(document.activeElement)) preencher();
});

$("versao").textContent = chrome.runtime.getManifest().version;
preencher().catch(async (erro) => {
  if (!t) await traduzir("auto");
  $("erros").textContent = String(erro);
  $("erros").hidden = false;
});
