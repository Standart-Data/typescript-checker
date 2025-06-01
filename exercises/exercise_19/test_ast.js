const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

describe("Function Overload Parsing Tests", function () {
  it("Функция add должна существовать с правильными перегрузками", function () {
    assert.ok(allVariables.functions.add, "Функция add не найдена");
    const addFunction = allVariables.functions.add;

    // Проверка количества перегрузок
    assert.strictEqual(
      Object.keys(addFunction).filter((k) => k.startsWith("overload")).length,
      2,
      "Должно быть 2 перегрузки"
    );
  });

  it("Первая перегрузка (string) должна быть корректной", function () {
    const overload0 = allVariables.functions.add.overload0;

    assert.strictEqual(
      overload0.returnResult[0],
      "string",
      "Возвращаемый тип должен быть string"
    );

    assert.deepStrictEqual(
      overload0.params.map((p) => p.type),
      ["string", "string"],
      "Параметры должны быть string, string"
    );

    assert.deepStrictEqual(
      overload0.params.map((p) => p.defaultValue),
      [null, null],
      "Значения по умолчанию должны отсутствовать"
    );
  });

  it("Вторая перегрузка (number) должна быть корректной", function () {
    const overload1 = allVariables.functions.add.overload1;

    assert.strictEqual(
      overload1.returnResult[0],
      "number",
      "Возвращаемый тип должен быть number"
    );

    assert.deepStrictEqual(
      overload1.params.map((p) => p.type),
      ["number", "number"],
      "Параметры должны быть number, number"
    );

    assert.strictEqual(
      overload1.body,
      null,
      "Тело перегрузки должно отсутствовать"
    );
  });

  it("Основная реализация должна содержать корректные данные", function () {
    const implementation = allVariables.functions.add;

    assert.strictEqual(
      implementation.returnResult[0],
      "any",
      "Возвращаемый тип реализации должен быть any"
    );

    assert.deepStrictEqual(
      implementation.params.map((p) => p.type),
      [["any"], ["any"]],
      "Параметры реализации должны быть any, any"
    );

    assert.ok(
      implementation.body.includes("return a + b"),
      "Тело функции должно содержать правильную логику"
    );
  });

  it("Общая структура функции должна сохранять совместимость", function () {
    const addFunction = allVariables.functions.add;

    // Проверка legacy-полей
    assert.deepStrictEqual(
      addFunction.params.map((p) => p.type),
      [["any"], ["any"]],
      "Основные параметры должны соответствовать реализации"
    );

    assert.strictEqual(
      addFunction.returnResult[0],
      "any",
      "Основной возвращаемый тип должен соответствовать реализации"
    );
  });
});
