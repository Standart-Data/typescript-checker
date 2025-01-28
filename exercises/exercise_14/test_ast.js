const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);
console.log(allVariables.types["Greeting"])
console.log(allVariables.functions)
describe("Function Type Parsing Tests", function () {
  it("Тип Greeting корректно обрабатывается", function () {
    assert.ok(allVariables.types["Greeting"], "Тип Greeting не найден");

    const greetingType = allVariables.types["Greeting"];

    // Проверяем, что это функциональный тип
    assert.strictEqual(greetingType.type, "function", "Greeting должен быть функциональным типом");

    // Проверяем параметры функции
    assert.strictEqual(greetingType.params.length, 1, "Greeting должен иметь один параметр");
    const param = greetingType.params[0];
    assert.strictEqual(param.name, "name", "Параметр должен называться name");
    assert.deepStrictEqual(param.types, ["string"], "Тип параметра должен быть string");
    assert.strictEqual(param.optional, true, "Параметр name должен быть опциональным");

    // Проверяем возвращаемый тип
    assert.strictEqual(
      greetingType.returnType,
      "string",
      "Greeting должен возвращать строку"
    );

    // Проверяем свойства типа Greeting
    assert.ok(greetingType.properties, "Greeting должен иметь свойства");
    assert.strictEqual(
      greetingType.properties.defaultName.types[0],
      "string",
      "Свойство defaultName должно быть строкой"
    );
    assert.strictEqual(
      greetingType.properties.setDefaultName.types[0],
      "(newName: string) => void",
      "Свойство setDefaultName должно быть функцией с параметром newName"
    );
  });

  it("Переменная someFunc соответствует типу Greeting", function () {
    assert.ok(allVariables.variables["someFunc"], "Переменная someFunc не найдена");

    const someFunc = allVariables.variables["someFunc"];

    // Проверяем тип переменной
    assert.strictEqual(
      someFunc.types[0],
      "Greeting",
      "someFunc должен быть типа Greeting"
    );

    // Проверяем свойства someFunc
    assert.ok(
      someFunc.value.defaultName,
      "someFunc должен иметь свойство defaultName"
    );
    assert.strictEqual(
      someFunc.value.defaultName,
      "Func",
      "Свойство defaultName должно быть равно 'Func'"
    );

    assert.ok(
      someFunc.value.setDefaultName,
      "someFunc должен иметь метод setDefaultName"
    );
    assert.strictEqual(
      typeof someFunc.value.setDefaultName,
      "function",
      "setDefaultName должен быть функцией"
    );
  });
});
