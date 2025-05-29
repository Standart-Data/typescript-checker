const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);
console.log(JSON.stringify(allVariables, null, 2));

describe("Class Parsing Tests", function () {
  it("Класс Plane имеет корректные свойства и модификаторы доступа", function () {
    assert.ok(allVariables.classes["Plane"]);
    const planeClass = allVariables.classes["Plane"];

    // Проверяем свойства класса
    assert.strictEqual(planeClass["make"].modificator, "readonly");
    assert.deepStrictEqual(planeClass["make"].types, ["string"]);
    assert.strictEqual(planeClass["make"].value, null);

    assert.strictEqual(planeClass["model"].modificator, "opened");
    assert.deepStrictEqual(planeClass["model"].types, ["string"]);
    assert.strictEqual(planeClass["model"].value, null);

    assert.strictEqual(planeClass["year"].modificator, "opened");
    assert.deepStrictEqual(planeClass["year"].types, ["any"]);
    assert.strictEqual(planeClass["year"].value, null);
  });

  it("Класс Plane имеет корректно обработанный конструктор", function () {
    assert.ok(allVariables.classes["Plane"]);
    const planeClass = allVariables.classes["Plane"];

    // Проверяем наличие конструктора
    assert.ok(planeClass["constructor"]);

    // Проверяем параметры конструктора
    const constructorParams = planeClass["constructor"].params;

    // Проверяем параметры конструктора make
    const makeParam = constructorParams.find((param) => param.make);
    assert.ok(makeParam);
    assert.deepStrictEqual(makeParam.make.types, ["string"]);
    assert.strictEqual(makeParam.make.defaultValue, null);

    // Проверяем параметры конструктора model
    const modelParam = constructorParams.find((param) => param.model);
    assert.ok(modelParam);
    assert.deepStrictEqual(modelParam.model.types, ["string"]);
    assert.strictEqual(modelParam.model.defaultValue, null);

    // Проверяем параметры конструктора year
    const yearParam = constructorParams.find((param) => param.year);
    assert.ok(yearParam);
    assert.deepStrictEqual(yearParam.year.types, ["any"]);
    assert.strictEqual(yearParam.year.defaultValue, null);
  });
});
