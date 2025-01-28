const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);

describe("Function Type Parsing Tests", function () {
  describe("Greeting Type", function () {
    it("Тип Greeting должен быть корректно обработан", function () {
      const greetingType = allVariables.types["Greeting"];
      assert.ok(greetingType, "Тип Greeting не найден");

      // Проверка, что это функциональный тип
      assert.strictEqual(greetingType.type, "function", "Greeting должен быть функциональным типом");

      // Проверка параметров функции
      assert.strictEqual(greetingType.params.length, 1, "Greeting должен иметь один параметр");
      const param = greetingType.params[0];
      assert.strictEqual(param.name, "name", "Параметр должен называться name");
      assert.strictEqual(param.type, "string", "Тип параметра должен быть string");
      assert.strictEqual(param.optional, true, "Параметр name должен быть опциональным");

      // Проверка возвращаемого типа
      assert.strictEqual(greetingType.returnType, "string", "Greeting должен возвращать строку");

      // Проверка свойств типа Greeting
      assert.ok(greetingType.properties, "Greeting должен иметь свойства");
      assert.strictEqual(
        greetingType.properties.defaultName,
        "string",
        "Свойство defaultName должно быть строкой"
      );
      assert.strictEqual(
        greetingType.properties.setDefaultName,
        "(newName: string) => void",
        "Свойство setDefaultName должно быть функцией с параметром newName"
      );
    });
  });

  describe("someFunc Variable", function () {
    it("Переменная someFunc должна соответствовать типу Greeting", function () {
      const someFunc = allVariables.functions["someFunc"];
      assert.ok(someFunc, "Переменная someFunc не найдена");

      // Проверка типа переменной
      assert.strictEqual(someFunc.types[0], "Greeting", "someFunc должен быть типа Greeting");

      // Проверка свойств someFunc
      assert.ok(someFunc.defaultName.value, "someFunc должен иметь свойство defaultName");
      assert.strictEqual(someFunc.defaultName.value, "Func", "Свойство defaultName должно быть равно 'Func'");

      assert.ok(someFunc.setDefaultName.value, "someFunc должен иметь метод setDefaultName");
      assert.strictEqual(someFunc.setDefaultName.value, "(anotherName) => {}", "setDefaultName должно быть равно (anotherName) => {}");
      assert.strictEqual(typeof someFunc.setDefaultName.types[0], "(anotherName: string) => void", "setDefaultName type должно быть равно function");
    });
  });
});
