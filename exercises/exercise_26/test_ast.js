const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

console.log(allVariables);

describe("Интерфейс 'Person'", function () {
  it("объявлен", function () {
    assert.ok(allVariables.interfaces["Person"]);
  });
  it("содержит необходимые свойства", function () {
    assert.ok(
      allVariables.interfaces["Person"].properties.name,
      "Свойство 'name' не найдено"
    );
    assert.ok(
      allVariables.interfaces["Person"].properties.phoneNumber,
      "Свойство 'phoneNumber' не найдено"
    );
    assert.strictEqual(
      allVariables.interfaces["Person"].properties.phoneNumber,
      "string",
      "Свойство 'phoneNumber' не верно типизировано"
    );
    assert.strictEqual(
      allVariables.interfaces["Person"].properties.name,
      "string",
      "Свойство 'name' не верно типизировано"
    );
  });
});
describe("Интерфейс 'Car'", function () {
  it("объявлен", function () {
    assert.ok(allVariables.interfaces["Car"]);
  });
  it("содержит необходимые свойства", function () {
    assert.ok(
      allVariables.interfaces["Car"].properties.model,
      "Свойство 'model' не найдено"
    );
    assert.ok(
      allVariables.interfaces["Car"].properties.bodyType,
      "Свойство 'bodyType' не найдено"
    );
    assert.ok(
      allVariables.interfaces["Car"].properties.plateNumber,
      "Свойство 'plateNumber' не найдено"
    );
    assert.strictEqual(
      allVariables.interfaces["Car"].properties.plateNumber,
      "string",
      "Свойство 'plateNumber' не верно типизировано"
    );
    assert.strictEqual(
      allVariables.interfaces["Car"].properties.model,
      "string",
      "Свойство 'model' не верно типизировано"
    );
    assert.strictEqual(
      allVariables.interfaces["Car"].properties.bodyType,
      "CarBodyType",
      "Свойство 'bodyType' не верно типизировано"
    );
  });
});
describe("Тип 'CarBodyType'", function () {
  it("объявлен", function () {
    assert.ok(allVariables.types["CarBodyType"]);
  });
  it("комбинированный", function () {
    assert.strictEqual(allVariables.types["CarBodyType"].type, "combined");
  });
  it("содержит необходимые варианты", function () {
    const reqParams = ["седан", "кроссовер", "микроавтобус"];
    //Функция для проверки содержания всех значений
    const hasAllreqParams = (reqParams, params) => {
      const availableKeys = params.map((item) =>
        item.value.replace(/["']/g, "")
      ); // Очистим ввод от вариативности ковычек
      return reqParams.every((value) => availableKeys.includes(value));
    };

    const paramsIsCorrect = hasAllreqParams(
      reqParams,
      allVariables.types["CarBodyType"].possibleTypes
    );

    assert.ok(paramsIsCorrect, "Варианты не корректны");
  });
});
