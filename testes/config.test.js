// Testes das funções puras de extensao/config.js. Rode com: node --test testes/
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const NG = require("../extensao/config.js");

test("normalizarUrl completa o esquema e aceita URLs comuns", () => {
  assert.equal(NG.normalizarUrl("github.com").url, "https://github.com/");
  assert.equal(NG.normalizarUrl("  https://x.com/a?b=1 ").url, "https://x.com/a?b=1");
  assert.equal(NG.normalizarUrl("localhost:8000").url, "https://localhost:8000/");
  assert.equal(NG.normalizarUrl("http://127.0.0.1:8000").url, "http://127.0.0.1:8000/");
  assert.equal(NG.normalizarUrl("C:\\pasta\\inicio.html").url, "file:///C:/pasta/inicio.html");
  assert.equal(NG.normalizarUrl("file:///C:/a.html").url, "file:///C:/a.html");
});

test("normalizarUrl recusa entradas perigosas ou inválidas", () => {
  for (const ruim of ["", "   ", "javascript:alert(1)", "data:text/html,oi", "edge://settings", "abc", "http://"]) {
    assert.equal(NG.normalizarUrl(ruim).ok, false, ruim);
  }
});

test("lerLista ignora vazias e comentários, remove repetidas e aponta a linha do erro", () => {
  const r = NG.lerLista("github.com\n\n# comentário\nhttps://github.com/\njavascript:x");
  assert.deepEqual(r.urls, ["https://github.com/"]);
  assert.equal(r.erros.length, 1);
  assert.equal(r.erros[0].chave, "erroLinha");
  assert.equal(r.erros[0].args[0], 5);
  assert.equal(r.erros[0].args[1].chave, "erroEsquema");
});

test("erros de validação usam chaves de tradução", () => {
  assert.equal(NG.normalizarUrl("").erro.chave, "erroUrlVazia");
  assert.deepEqual(NG.normalizarUrl("javascript:x").erro, { chave: "erroEsquema", args: ["javascript:"] });
  assert.deepEqual(NG.normalizarUrl("abc").erro, { chave: "erroNaoEndereco", args: ["abc"] });
});

test("sanear descarta valores inválidos", () => {
  const c = NG.sanear({ urls: ["ok.com", "javascript:x"], escolha: "xyz", abertura: 1, reserva: "abc", idioma: "fr" });
  assert.deepEqual(c.urls, ["https://ok.com/"]);
  assert.equal(c.idioma, "auto");
  assert.equal(NG.sanear({ idioma: "pt_BR" }).idioma, "pt_BR");
  assert.equal(c.escolha, "primeira");
  assert.equal(c.abertura, "substituir");
  assert.equal(c.reserva, "");
  assert.deepEqual(NG.sanear(undefined).urls, []);
});

test("escolherUrl: primeira, rotação e sorteio", () => {
  const urls = ["https://a.com/", "https://b.com/", "https://c.com/"];
  assert.equal(NG.escolherUrl({ urls: [], escolha: "primeira" }, 0), null);
  assert.deepEqual(NG.escolherUrl({ urls, escolha: "primeira" }, 2), { url: urls[0], proximoIndice: 2 });

  const rot = { urls, escolha: "rotacao" };
  assert.deepEqual(NG.escolherUrl(rot, undefined), { url: urls[0], proximoIndice: 1 });
  assert.deepEqual(NG.escolherUrl(rot, 2), { url: urls[2], proximoIndice: 0 });
  assert.equal(NG.escolherUrl(rot, 7).url, urls[1]); // índice antigo maior que a lista

  const alea = { urls, escolha: "aleatoria" };
  assert.equal(NG.escolherUrl(alea, 0, 0).url, urls[0]);
  assert.equal(NG.escolherUrl(alea, 0, 0.99).url, urls[2]);
});
