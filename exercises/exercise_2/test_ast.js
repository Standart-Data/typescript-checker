const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

describe("First test", function () {
  it("В коде объявлена переменная pi c типом number", function () {
    assert.ok(allVariables.variables["pi"]["types"].includes("number"));
  });

  it("В коде объявлена переменная tau c типом number", function () {
    assert.ok(allVariables.variables["tau"]["types"].includes("number"));
  });
});
