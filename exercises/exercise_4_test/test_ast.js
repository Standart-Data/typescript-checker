// Здесь импорты, мы их НЕ переносим в тесты в админке

const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

console.log(allVariables);
// Здесь начинаются тесты, их мы переносим

describe("Тип 'Greeting'", function () {
  const typeGreeting = allVariables.types["Greeting"];
  it(`Тип 'Greeting' является гибридным`, function () {
    assert.strictEqual(typeGreeting.type, "function");
  });

  it(`Тип 'Greeting' содержит 'defaultName'`, function () {
    assert.ok(
      typeGreeting.properties["defaultName"],
      "'defaultName' - не найдено"
    );
    assert.strictEqual(
      typeGreeting.properties["defaultName"],
      "string",
      "'defaultName' - не верный тип"
    );
  });

  it(`Тип 'Greeting' содержит метод 'setDefaultName'`, function () {
    assert.ok(
      typeGreeting.properties["setDefaultName"],
      "Метод 'setDefaultName' - не найден"
    );
    assert.ok(
      typeGreeting.properties["setDefaultName"]
        .replace(/.*\((.*?)\).*/, "$1")
        .includes("string"),
      "Параметр метода типизирован неверно"
    );
    assert.ok(
      typeGreeting.properties["setDefaultName"]
        .replace(/.*?\)\s*=>\s*/, "=> ")
        .includes("void"),
      "Метод должен возвращать void"
    );
  });

  if (typeGreeting.params) {
    it(`Тип 'Greeting' принимает корректный параметр 'name'`, function () {
      assert.strictEqual(
        typeGreeting.params[0]["name"],
        "name",
        "Параметр 'name' не найден"
      );
      assert.strictEqual(
        typeGreeting.params[0]["type"],
        "string",
        "Неверный тип параметра"
      );
      assert.strictEqual(
        typeGreeting.params[0]["optional"],
        true,
        "Параметр 'name' является опциональным"
      );
    });
  }
});
