const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

describe("Тип 'Playlist'", function () {
  it(`является гибридным`, function () {
    assert.strictEqual(allVariables.types["Playlist"].type, "function");
  });
  it(`содержит 'title'`, function () {
    assert.ok(
      allVariables.types["Playlist"].properties["title"],
      "'title' - не найдено"
    );
    assert.strictEqual(
      allVariables.types["Playlist"].properties["title"],
      "string",
      "'title' - не верный тип"
    );
  });
  it(`в качестве функции примает параметр 'song'`, function () {
    assert.strictEqual(
      allVariables.types["Playlist"].params[0].name,
      "song",
      "Параметр 'song' не найден"
    );
    assert.strictEqual(
      allVariables.types["Playlist"].params[0].type,
      "string",
      "Параметр 'song' неверно типизирован"
    );
  });
  it(`в качестве функции возвращает 'void'`, function () {
    assert.strictEqual(allVariables.types["Playlist"].returnType, "void");
  });
  it(`содержит метод 'getPlaylist'`, function () {
    assert.ok(
      allVariables.types["Playlist"].properties["getPlaylist"],
      "Метод 'getPlaylist' - не найден"
    );
    assert.ok(
      allVariables.types["Playlist"].properties["getPlaylist"]
        .replace(/.*?\)\s*=>\s*/, "=> ")
        .includes("string[]"),
      "Метод должен возвращать 'string[]'"
    );
  });
  it(`содержит метод 'clearPlaylist'`, function () {
    assert.ok(
      allVariables.types["Playlist"].properties["clearPlaylist"],
      "Метод 'clearPlaylist' - не найден"
    );
    assert.ok(
      allVariables.types["Playlist"].properties["clearPlaylist"]
        .replace(/.*?\)\s*=>\s*/, "=> ")
        .includes("void"),
      "Метод должен возвращать 'void'"
    );
  });
  it(`содержит метод 'setPlaylist'`, function () {
    assert.ok(
      allVariables.types["Playlist"].properties["setPlaylist"],
      "Метод 'setPlaylist' - не найден"
    );
    assert.ok(
      allVariables.types["Playlist"].properties["setPlaylist"]
        .replace(/.*\((.*?)\).*/, "$1")
        .includes("string[]"),
      "Параметр метода типизирован неверно"
    );
    assert.ok(
      allVariables.types["Playlist"].properties["setPlaylist"]
        .replace(/.*?\)\s*=>\s*/, "=> ")
        .includes("void"),
      "Метод должен возвращать 'void'"
    );
  });
});
