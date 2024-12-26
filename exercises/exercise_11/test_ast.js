const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);

describe("First test", function () {
  it("В коде объявлен тип Moderator", function () {
    assert.ok(allVariables.types["Moderator"]);
  });
});
