// Testes de extensao/i18n.js e dos arquivos _locales. Rode com: node --test testes/
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const I18n = require("../extensao/i18n.js");
const NG = require("../extensao/config.js");

const raizExt = path.join(__dirname, "..", "extensao");
const ler = (idioma) =>
  JSON.parse(fs.readFileSync(path.join(raizExt, "_locales", idioma, "messages.json"), "utf8"));
const en = ler("en");
const pt = ler("pt_BR");

test("os dois idiomas têm exatamente as mesmas chaves", () => {
  assert.deepEqual(Object.keys(pt).sort(), Object.keys(en).sort());
});

test("toda chave usada no HTML, no JS e no manifest existe", () => {
  const usadas = new Set();
  for (const arquivo of fs.readdirSync(raizExt)) {
    if (!/\.(html|js|json)$/.test(arquivo)) continue;
    const texto = fs.readFileSync(path.join(raizExt, arquivo), "utf8");
    for (const m of texto.matchAll(/data-i18n(?:-html|-title|-placeholder)?="(\w+)"/g)) usadas.add(m[1]);
    for (const m of texto.matchAll(/__MSG_(\w+)__/g)) usadas.add(m[1]);
    for (const m of texto.matchAll(/(?:chave|titulo|texto): "(\w+)"/g)) usadas.add(m[1]);
    for (const m of texto.matchAll(/status\("(\w+)"\)/g)) usadas.add(m[1]);
  }
  assert.ok(usadas.size > 30, `poucas chaves encontradas (${usadas.size})`);
  for (const chave of usadas) assert.ok(en[chave], `chave sem tradução: ${chave}`);
});

test("descrição do manifest cabe no limite de 132 caracteres", () => {
  for (const msgs of [en, pt]) assert.ok(msgs.descricao.message.length <= 132);
});

test("resolverIdioma segue o Edge no automático", () => {
  assert.equal(I18n.resolverIdioma("auto", "pt-BR"), "pt_BR");
  assert.equal(I18n.resolverIdioma("auto", "pt-PT"), "pt_BR");
  assert.equal(I18n.resolverIdioma("auto", "en-US"), "en");
  assert.equal(I18n.resolverIdioma("auto", "es"), "en");
  assert.equal(I18n.resolverIdioma("en", "pt-BR"), "en");
  assert.equal(I18n.resolverIdioma("pt_BR", "en-US"), "pt_BR");
});

test("formatar troca $1/$2, cai no inglês e por fim na chave", () => {
  assert.equal(I18n.formatar(pt, en, "erroLinha", [3, "x"]), "Linha 3: x");
  assert.equal(I18n.formatar({}, en, "erroLinha", [3, "x"]), "Line 3: x");
  assert.equal(I18n.formatar({}, {}, "inexistente", []), "inexistente");
});

test("traduzirErro resolve erros aninhados", () => {
  const t = (chave, ...args) => I18n.formatar(pt, en, chave, args);
  const { erros } = NG.lerLista("ok.com\nabc");
  assert.equal(I18n.traduzirErro(t, erros[0]), 'Linha 2: "abc" não parece um endereço.');
});
