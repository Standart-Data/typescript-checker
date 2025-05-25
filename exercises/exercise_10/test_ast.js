const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

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
