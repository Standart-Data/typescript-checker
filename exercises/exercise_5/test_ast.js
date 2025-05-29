const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

describe("TypeScript Type Checking for Inventory Code", function () {
  it("Переменная inventoryItem имеет корректный тип", function () {
    const inventoryItem = allVariables.variables["inventoryItem"];
    assert.strictEqual(inventoryItem.types[0], "[string, number]");
  });

  it("Переменная msg имеет корректный тип", function () {
    const msg = allVariables.variables["msg"];
    assert.strictEqual(msg.types[0], "string");
  });

  it("В коде объявлена функция addInventory с параметрами типов any", function () {
    const functionParams = allVariables.functions["addInventory"]["parameters"];
    const nameParam = functionParams.find((param) => param.name === "name");
    const quantityParam = functionParams.find(
      (param) => param.name === "quantity"
    );
    assert.strictEqual(nameParam.type, "any");
    assert.strictEqual(quantityParam.type, "any");
  });

  it("Функция addInventory имеет возвращаемый тип string", function () {
    assert.strictEqual(
      allVariables.functions["addInventory"]["returnType"],
      "string"
    );
  });
});
