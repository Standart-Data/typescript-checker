// Здесь импорты, мы их НЕ переносим в тесты в админке

const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

console.log(allVariables);
// Здесь начинаются тесты, их мы переносим

describe("Переменная a:", function () {
  it("Объявлена переменная a c типом string | number", function () {
    assert.ok(allVariables.variables["a"]["types"].includes("string | number"));
  });

  it("Значение переменной а = 5", function () {
    console.log(allVariables.variables["a"]["value"]);
    assert.ok(allVariables.variables["a"]["value"] === "5");
  });
});

describe("Переменная b:", function () {
  it("В коде объявлена переменная a c типом string", function () {
    assert.ok(allVariables.variables["b"]["types"].includes("string"));
  });

  it("Переменная b имеет значение Its a string", function () {
    assert.ok(allVariables.variables["b"]["value"] === "Its a string");
  });
});
