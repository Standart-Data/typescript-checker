const { readTsFiles } = require("../parse");
const assert = require("assert");

const allVariables = readTsFiles([
  "./exercise_1/main.ts",
  "./exercise_2/main.ts",
  "./exercise_3/main.ts",
  "./exercise_4/main.ts",
  "./exercise_5/main.ts",
  "./exercise_6/main.ts",
  "./exercise_7/main.js",
  "./exercise_8/main.js",
  "./exercise_9/main.js",
  "./exercise_10/main.ts",
]);

describe("First test", function () {
  it("В коде объявлена переменная a c типом number", function () {
    assert.ok(allVariables.variables["a"]["types"].includes("number"));
  });

  it("В коде объявлена переменная b c типом string", function () {
    assert.ok(allVariables.variables["b"]["types"].includes("string"));
  });
});
