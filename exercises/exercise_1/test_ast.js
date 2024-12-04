const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);

describe("Переменная a:", function () {
  it("Объявлена переменная a c типом any", function () {
    assert.ok(allVariables.variables["a"]["types"].includes("any"));
  });

  it("Значение переменной а = 5", function () {
    console.log(allVariables.variables["a"]["value"])
    assert.ok(allVariables.variables["a"]["value"] === "5")
  });
});

describe("Переменная b:", function () {
  it("В коде объявлена переменная a c типом any", function () {
    assert.ok(allVariables.variables["a"]["types"].includes("any"));
  });

  it("В коде объявлена переменная b c типом any", function () {
    assert.ok(allVariables.variables["b"]["types"].includes("any"));
  });
});

