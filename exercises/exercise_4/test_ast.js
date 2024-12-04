const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);

describe("First test", function () {
  it("В коде объявлена переменная a c типом any", function () {
    assert.ok(allVariables.variables["integer"]["types"].includes("any"));
  });

  it("В коде объявлена переменная b c типом any", function () {
    assert.ok(allVariables.variables["float"]["types"].includes("any"));
  });

  it("В коде объявлена переменная b c типом any", function () {
    assert.ok(allVariables.variables["hex"]["types"].includes("any"));
  });

  it("В коде объявлена переменная b c типом any", function () {
    assert.ok(allVariables.variables["binary"]["types"].includes("any"));
  });

  it("В коде объявлена переменная b c типом any", function () {
    assert.ok(allVariables.variables["octal"]["types"].includes("any"));
  });

  it("В коде объявлена переменная b c типом any", function () {
    assert.ok(allVariables.variables["negZero"]["types"].includes("any"));
  });

  it("В коде объявлена переменная b c типом any", function () {
    assert.ok(
      allVariables.variables["actuallyNumber"]["types"].includes("any")
    );
  });

  it("В коде объявлена переменная b c типом any", function () {
    assert.ok(allVariables.variables["largestNumber"]["types"].includes("any"));
  });

  it("В коде объявлена переменная b c типом any", function () {
    assert.ok(
      allVariables.variables["mostBiglyNumber"]["types"].includes("any")
    );
  });
});
