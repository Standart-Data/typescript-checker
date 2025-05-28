const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

console.log("Parsed classes:", JSON.stringify(allVariables.classes, null, 2));

describe("Класс Island. Модификатор параметра", function () {
  it("'name' корректный", function () {
    assert.strictEqual(
      allVariables.classes["Island"].name.modificator,
      "protected",
      "Неверный модификатор доступа"
    );
  });
  it("'coordinates' корректный", function () {
    assert.strictEqual(
      allVariables.classes["Island"].coordinates.modificator,
      "readonly",
      "Неверный модификатор доступа"
    );
  });
  it("'size' корректный", function () {
    assert.strictEqual(
      allVariables.classes["Island"].size.modificator,
      "protected",
      "Неверный модификатор доступа"
    );
  });
  it("'notes' корректный", function () {
    assert.strictEqual(
      allVariables.classes["Island"].notes.modificator,
      "protected",
      "Неверный модификатор доступа"
    );
  });
  it("'features' корректный", function () {
    assert.strictEqual(
      allVariables.classes["Island"].features.modificator,
      "protected",
      "Неверный модификатор доступа"
    );
  });
});
describe("Класс 'ResourceIsland'", function () {
  it("объявлен", function () {
    assert.ok(
      allVariables.classes["ResourceIsland"],
      "Класс 'ResourceIsland' не найден"
    );
  });
  it("наследник класса 'Island'", function () {
    assert.strictEqual(
      allVariables.classes["ResourceIsland"].extends[0],
      "Island",
      "Класс 'ResourceIsland' не наследует 'Island'"
    );
  });
  it("имеет корректный параметр 'resources'", function () {
    assert.ok(
      allVariables.classes["ResourceIsland"].resources,
      "Параметр 'resources' не найден"
    );
    assert.strictEqual(
      allVariables.classes["ResourceIsland"].resources.types[0],
      "string[]",
      "Параметр 'resources' неверно типизирован"
    );
    assert.strictEqual(
      allVariables.classes["ResourceIsland"].resources.modificator,
      "private",
      "Неверный модификатор доступа"
    );
  });
  it("имеет в конструкторе родительские параметры", function () {
    const reqParams = ["name", "coordinates", "size", "notes", "resources"];
    const hasAllreqParams = (reqParams, params) => {
      const availableKeys = params.map((item) => Object.keys(item)[0]);
      return reqParams.every((key) => availableKeys.includes(key));
    };
    const paramsIsCorrect = hasAllreqParams(
      reqParams,
      allVariables.classes["ResourceIsland"].constructor.params
    );
    assert.ok(paramsIsCorrect, "Не корректные параметры в конструкторе");
  });
});
