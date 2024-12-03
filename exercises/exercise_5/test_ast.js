const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);

describe("TypeScript Type Checking for Inventory Code", function () {
  it("Переменная inventoryItem имеет корректный тип", function () {
    const inventoryItem = allVariables.variables["inventoryItem"];
    assert.strictEqual(inventoryItem.types[0], "[string, number]");
  });

  it("Переменная name имеет корректный тип и источник", function () {
    const name = allVariables.variables["name"];
    assert.strictEqual(name.types[0], "string");
    assert.strictEqual(name.from, "inventoryItem");
  });

  it("Переменная qty имеет корректный тип и источник", function () {
    const qty = allVariables.variables["qty"];
    assert.strictEqual(qty.types[0], "number");
    assert.strictEqual(qty.from, "inventoryItem");
  });

  it("Переменная msg имеет корректный тип", function () {
    const msg = allVariables.variables["msg"];
    assert.strictEqual(msg.types[0], "string");
  });

  it("В коде объявлена функция addInventory с параметрами типов string и number", function () {
    const functionParams = allVariables.functions["addInventory"]["params"];
    const nameParam = functionParams.find((param) => param.name === "name");
    const quantityParam = functionParams.find(
      (param) => param.name === "quantity"
    );
    assert.strictEqual(nameParam.type, "string");
    assert.strictEqual(quantityParam.type, "number");
  });

  it("Функция addInventory имеет возвращаемый тип string", function () {
    assert.ok(
      allVariables.functions["addInventory"]["returnResult"].includes("string")
    );
  });
});
