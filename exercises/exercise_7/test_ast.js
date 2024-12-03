const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);

describe("First test", function () {
  it('В коде объявлен тип Direction cо значением "North" | "South" | "East" | "West"', function () {
    assert.ok(
      allVariables.types["Direction"].includes(
        '"North" | "South" | "East" | "West"'
      )
    );
  });

  it("В коде объявлена функция move c возвращаемым типом void", function () {
    assert.ok(allVariables.functions["move"]["returnResult"].includes("void"));
  });

  it("В коде объявлена функция move c параметрами direction, где тип Direction", function () {
    assert.ok(
      allVariables.functions["move"]["params"][0].name.includes("direction") &&
        allVariables.functions["move"]["params"][0].type.includes("Direction")
    );
  });
});
