const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);

describe("First test", function () {
  it("В коде объявлен класс Car с параметром make с типом string", function () {
    assert.ok(allVariables.classes["Car"]["make"]["types"].includes("string"));
  });

  it("В коде объявлен класс Car с параметром model с типом string", function () {
    assert.ok(allVariables.classes["Car"]["model"]["types"].includes("string"));
  });

  it("В коде объявлен класс Car с параметром year с типом number", function () {
    assert.ok(allVariables.classes["Car"]["year"]["types"].includes("number"));
  });
});
