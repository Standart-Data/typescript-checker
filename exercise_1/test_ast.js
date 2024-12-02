const { readTsFiles } = require("../parse");
const assert = require("assert");

const allVariables = readTsFiles(["main.ts"]);

describe("First test", function () {
  it("В коде объявлена переменная a c типом number", function () {
    assert.ok(allVariables.variables["a"]["types"].includes("number"));
  });

  it("В коде объявлена переменная b c типом string", function () {
    assert.ok(allVariables.variables["b"]["types"].includes("string"));
  });
});
