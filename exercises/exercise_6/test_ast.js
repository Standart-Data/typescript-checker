const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

describe("First test", function () {
  it("В коде объявлена переменная sequence c типом number[]", function () {
    assert.ok(allVariables.variables["sequence"]["types"].includes("number[]"));
  });

  it("В коде объявлена переменная animals c типом string[]", function () {
    assert.ok(allVariables.variables["animals"]["types"].includes("string[]"));
  });

  it("В коде объявлена переменная stringsAndNumbers c типом (number | string)[]", function () {
    assert.ok(
      allVariables.variables["stringsAndNumbers"]["types"].includes(
        "(number | string)[]"
      )
    );
  });

  it("В коде объявлена переменная allMyArrays c типом (number[] | string[] | (number | string)[])[]", function () {
    assert.ok(
      allVariables.variables["allMyArrays"]["types"].includes(
        "(number[] | string[] | (number | string)[])[]"
      )
    );
  });
});
