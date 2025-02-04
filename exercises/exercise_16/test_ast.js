const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);

describe("Function Body Parsing Tests", function () {
  it("Тело функции makeSound в классе Animal корректно обрабатывается", function () {
    assert.ok(allVariables.classes["Animal"], "Класс Animal не найден");

    const animalClass = allVariables.classes["Animal"];
    assert.ok(animalClass.makeSound, "Метод makeSound не найден");

    const makeSoundMethod = animalClass.makeSound;
    assert.strictEqual(
      typeof makeSoundMethod.body,
      "string",
      "Тело метода makeSound должно быть строкой"
    );

    assert.strictEqual(
      makeSoundMethod.body,
      "{\r\n    console.log(`Как говорит ${this.name}?`);\r\n  }",
      "Тело метода makeSound не совпадает"
    );
  });

  it("Тело функции makeSound в классе Dog корректно обрабатывается", function () {
    assert.ok(allVariables.classes["Dog"], "Класс Dog не найден");

    const dogClass = allVariables.classes["Dog"];
    assert.ok(dogClass.makeSound, "Метод makeSound не найден");

    const makeSoundMethod = dogClass.makeSound;
    assert.strictEqual(
      typeof makeSoundMethod.body,
      "string",
      "Тело метода makeSound должно быть строкой"
    );

    assert.strictEqual(
      makeSoundMethod.body.trim(),
      "{\r\n" +
        "    console.log(`${this.name} лает: Гав-гав!`); // Полное переопределение метода\r\n" +
        "  }",
      "Тело метода makeSound не совпадает"
    );
  });
});
