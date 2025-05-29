const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

describe("Функция splitArray", function () {
  it("Параметр 'array' типизирован корректно", function () {
    assert.ok(
      !allVariables.functions.splitArray.params[0].type.includes("any")
    );

    assert.ok(
      allVariables.functions.splitArray.returnResult[0].includes(
        allVariables.functions.splitArray.params[0].type[0]
      )
    );
  });

  it("Параметр 'predicate' типизирован корректно", function () {
    assert.ok(
      !allVariables.functions.splitArray.params[1].type.includes("any")
    );

    assert.ok(
      allVariables.functions.splitArray.params[1].type.includes(
        allVariables.functions.splitArray.params[0].type[0]
      )
    );
  });

  it("Внутренние сущности функции 'splitArray' типизированы корректно", function () {
    assert.ok(!allVariables.functions.splitArray.body.includes("any"));
  });

  it("Тип переменной numberSplit -- массив чисел", function () {
    assert.ok(allVariables.variables.numberSplit.types[0].includes("number"));
  });

  it("Тип переменной stringSplit -- массив строк", function () {
    assert.ok(allVariables.variables.stringSplit.types[0].includes("string"));
  });
});
