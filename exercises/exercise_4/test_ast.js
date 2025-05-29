const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

describe("First test", function () {
  it("В коде объявлена переменная integer c литеральным типом", function () {
    assert.ok(allVariables.variables["integer"]["types"].includes("6"));
  });

  it("В коде объявлена переменная float c литеральным типом", function () {
    assert.ok(allVariables.variables["float"]["types"].includes("6.66"));
  });

  it("В коде объявлена переменная hex c литеральным типом", function () {
    assert.ok(allVariables.variables["hex"]["types"].includes("61453"));
  });

  it("В коде объявлена переменная binary c литеральным типом", function () {
    assert.ok(allVariables.variables["binary"]["types"].includes("666"));
  });

  it("В коде объявлена переменная octal c литеральным типом", function () {
    assert.ok(allVariables.variables["octal"]["types"].includes("484"));
  });

  it("В коде объявлена переменная negZero c литеральным типом", function () {
    assert.ok(allVariables.variables["negZero"]["types"].includes("0"));
  });

  it("В коде объявлена переменная actuallyNumber c типом number", function () {
    assert.ok(
      allVariables.variables["actuallyNumber"]["types"].includes("number")
    );
  });

  it("В коде объявлена переменная largestNumber c типом number", function () {
    assert.ok(
      allVariables.variables["largestNumber"]["types"].includes("number")
    );
  });

  it("В коде объявлена переменная mostBiglyNumber c типом number", function () {
    assert.ok(
      allVariables.variables["mostBiglyNumber"]["types"].includes("number")
    );
  });
});
