// Здесь импорты, мы их НЕ переносим в тесты в админке

const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

console.log(allVariables);
// Здесь начинаются тесты, их мы переносим

describe("Тип FilmPreview", function () {
  it("Тип FilmPreview создан", function () {
    assert.ok(allVariables.types.FilmPreview);
  });

  it("Тип FilmPreview корректно типизирован", function () {
    assert.ok(
      allVariables.types.FilmPreview.value.replace(/\s/g, "") ===
        'Pick<Film,"id"|"description"|"genres"|"logo"|"name">'
    );
  });
});
