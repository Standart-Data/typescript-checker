const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);

describe("First test", function () {
  it("В коде объявлена переменная a c типом any", function () {
    assert.ok(allVariables.variables["a"]["types"].includes("any"));
  });

  it("В коде объявлена переменная b c типом any", function () {
    assert.ok(allVariables.variables["b"]["types"].includes("any"));
  });
});
