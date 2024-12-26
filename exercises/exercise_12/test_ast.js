const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);

describe("Testing TypeScript Code Parsing", function () {
  it("Должен корректно определить тип number для numberTypeResult", function () {
    assert.ok(allVariables.variables["numberTypeResult"]);
    assert.deepEqual(allVariables.variables["numberTypeResult"].types, ["number"]);
  });

  it("Должен корректно определить тип string для sasa", function () {
    assert.ok(allVariables.variables["sasa"]);
    assert.deepEqual(allVariables.variables["sasa"].types, ["string"]);
  });

  it("Должен корректно определить value для sasa", function () {
    assert.ok(allVariables.variables["sasa"]);
    assert.deepEqual(allVariables.variables["sasa"].value, "stringer()");
  });

  it("Должен корректно определить value для numberTypeResult", function () {
    assert.ok(allVariables.variables["numberTypeResult"]);
    assert.deepEqual(allVariables.variables["numberTypeResult"].value, "logger(10 * 2)");
  });

  it("Должен корректно определить функцию logger", function () {
    assert.ok(allVariables.functions["logger"]);
    assert.deepEqual(allVariables.functions["logger"].types, ["function"]);
  });

  it("Должен корректно определить функцию stringer", function () {
    assert.ok(allVariables.functions["stringer"]);
    assert.deepEqual(allVariables.functions["stringer"].types, ["function"]);
  });
});
