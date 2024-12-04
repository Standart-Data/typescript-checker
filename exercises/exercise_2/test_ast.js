const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);

describe("First test", function () {
  it("В коде объявлена переменная pi c типом number", function () {
    assert.ok(allVariables.variables["pi"]["types"].includes("number"));
  });

  it("В коде объявлена переменная tau c типом number", function () {
    assert.ok(allVariables.variables["tau"]["types"].includes("any"));
  });
});
