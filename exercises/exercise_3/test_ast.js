const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);

describe("First test", function () {
  it("В коде объявлена переменная isMark c типом boolean", function () {
    assert.ok(allVariables.variables["isMark"]["types"].includes("boolean"));
  });
});
