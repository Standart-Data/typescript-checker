const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);

describe("First test", function () {
  it("В коде объявлена переменная inventoryItem c типом any", function () {
    assert.ok(allVariables.variables["inventoryItem"]["types"].includes("any"));
  });

  it("В коде объявлена переменная b c типом string", function () {
    assert.ok(allVariables.variables["tau"]["types"].includes("number"));
  });

  it("В коде объявлена переменная b c типом string", function () {
    assert.ok(allVariables.variables["tau"]["types"].includes("number"));
  });

  it("В коде объявлена переменная b c типом string", function () {
    assert.ok(allVariables.variables["tau"]["types"].includes("number"));
  });

  it("В коде объявлена переменная b c типом string", function () {
    assert.ok(allVariables.variables["tau"]["types"].includes("number"));
  });
});
