const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

describe("First test", function () {
  it("В коде объявлена переменная isMark c типом boolean", function () {
    assert.ok(allVariables.variables["isMark"]["types"].includes("boolean"));
  });
});
