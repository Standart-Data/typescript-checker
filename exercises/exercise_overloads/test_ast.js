const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

console.log(allVariables);

// Создаем объект dom для совместимости с тестом
const dom = {};
// Создаем функцию из парсированного кода
eval(
  `dom.getPerimeter = function getPerimeter(value1, value2) ${allVariables.functions.getPerimeter.body}`
);

describe("getPerimeter", function () {
  it("Должна вычислять длину окружности при передаче одного аргумента", function () {
    assert.strictEqual(dom.getPerimeter(0), 0);
    assert.strictEqual(dom.getPerimeter(5), 2 * Math.PI * 5);
    assert.strictEqual(dom.getPerimeter(100), 2 * Math.PI * 100);
  });

  it("Должна вычислять периметр прямоугольника при передаче двух аргументов", function () {
    assert.strictEqual(dom.getPerimeter(4, 6), 2 * (4 + 6));
    assert.strictEqual(dom.getPerimeter(100, 200), 2 * (100 + 200));
    assert.strictEqual(dom.getPerimeter(0, 0), 0);
  });
});

describe("TypeScript Type Checking", function () {
  it("У функции getPerimeter две перегрузки", function () {
    assert.ok(
      allVariables.functions.getPerimeter,
      "Функция getPerimeter не найдена"
    );
    const fn = allVariables.functions.getPerimeter;

    // Проверка количества перегрузок
    assert.strictEqual(
      Object.keys(fn).filter((k) => k.startsWith("overload")).length,
      2,
      "Должно быть 2 перегрузки"
    );
  });

  it("У первой перегрузки корректные параметры", function () {
    const overload0 = allVariables.functions.getPerimeter.overload0;

    assert.strictEqual(
      overload0.returnResult[0],
      "number",
      "Возвращаемый тип должен быть number"
    );

    assert.deepStrictEqual(
      overload0.params.map((p) => p.type),
      ["number"]
    );
  });

  it("У второй перегрузки корректные параметры", function () {
    const overload1 = allVariables.functions.getPerimeter.overload1;

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
  });

  it("У основной реализации корректные параметры", function () {
    const implementation = allVariables.functions.getPerimeter;

    assert.strictEqual(
      implementation.returnResult[0],
      "number",
      "Возвращаемый тип реализации должен быть number"
    );

    assert.deepStrictEqual(
      implementation.params.map((p) => p.type),
      [["number"], ["number"]],
      "Параметры реализации должны быть any, any"
    );
  });
});
