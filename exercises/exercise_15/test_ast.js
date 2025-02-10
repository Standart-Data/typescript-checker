const { readTsFiles } = require("../../parse");
const assert = require("assert");

const allVariables = readTsFiles(["./main.ts"]);

describe("Class Parsing Tests", function () {
  it("Класс Animal корректно обрабатывается", function () {
    assert.ok(allVariables.classes["Animal"], "Класс Animal не найден");

    const animalClass = allVariables.classes["Animal"];

    // Проверяем свойства класса
    assert.ok(animalClass.name, "Свойство name не найдено");
    assert.strictEqual(animalClass.name.types[0], "string", "Тип свойства name должен быть string");
    assert.strictEqual(animalClass.name.modificator, "protected", "Свойство name должно быть protected");

    // Проверяем конструктор
    assert.ok(animalClass.constructor, "Конструктор не найден");
    assert.strictEqual(
      animalClass.constructor.body,
      '{\r\n    this.name = name;\r\n  }',
      "Тело конструктора Animal не совпадает"
    );

    // Проверяем методы класса
    assert.ok(animalClass.makeSound, "Метод makeSound не найден");
    assert.strictEqual(animalClass.makeSound.types[0], "function", "makeSound должен быть функцией");
    assert.strictEqual(animalClass.makeSound.modificator, "opened", "Метод makeSound должен быть public");
  });

  it("Класс Dog корректно обрабатывается и наследует Animal", function () {
    assert.ok(allVariables.classes["Dog"], "Класс Dog не найден");

    const dogClass = allVariables.classes["Dog"];

    // Проверяем наследование
    assert.ok(dogClass.extends, "Наследование не найдено");
    assert.strictEqual(dogClass.extends.length, 1, "Dog должен наследовать один класс");
    assert.strictEqual(dogClass.extends[0], "Animal", "Dog должен наследовать Animal");

    // Проверяем конструктор
    assert.ok(dogClass.constructor, "Конструктор не найден");
    assert.strictEqual(
      dogClass.constructor.body.trim(),
      "{\r\n    super(name) // Вызов конструктора родительского класса\r\n  }",
      "Тело конструктора Dog не совпадает"
    );

    // Проверяем методы класса
    assert.ok(dogClass.makeSound, "Метод makeSound не найден");
    assert.strictEqual(dogClass.makeSound.types[0], "function", "makeSound должен быть функцией");
    assert.strictEqual(dogClass.makeSound.modificator, "opened", "Метод makeSound должен быть public");
  });
});