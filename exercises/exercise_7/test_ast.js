const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

describe("First test", function () {
  it('В коде объявлен тип Direction cо значением "North" | "South" | "East" | "West"', function () {
    const allTypes = allVariables.types["Direction"]["possibleTypes"].map((type) => type.value)

    assert.ok(
      allTypes.includes('"North"') && allTypes.includes('"South"') && allTypes.includes('"East"') && allTypes.includes('"West"')
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
