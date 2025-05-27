const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

console.log(JSON.stringify(allVariables, null, 2));

describe("Class Constructor Parsing Tests", function () {
  it("Класс Computer должен быть корректно обработан", function () {
    assert.ok(allVariables.classes["Computer"], "Класс Computer не найден");
    const computerClass = allVariables.classes["Computer"];

    // Проверка полей класса
    assert.ok(computerClass.id, "Поле id не найдено");
    assert.ok(computerClass.name, "Поле name не найдено");
    assert.ok(computerClass.model, "Поле model не найдено");
    assert.ok(computerClass.version, "Поле version не найдено");
    assert.ok(computerClass.color, "Поле color не найдено");

    // Проверка модификаторов доступа
    assert.strictEqual(
      computerClass.id.modificator,
      "private",
      "Модификатор id должен быть private"
    );
    assert.strictEqual(
      computerClass.name.modificator,
      "protected",
      "Модификатор name должен быть protected"
    );
    assert.strictEqual(
      computerClass.model.modificator,
      "opened",
      "Модификатор model должен быть public"
    );
  });

  it("Конструкторы должны иметь правильные сигнатуры", function () {
    const computerClass = allVariables.classes["Computer"];

    // Проверка наличия сигнатур
    assert.ok(
      computerClass.constructorSignature0,
      "Первая сигнатура конструктора не найдена"
    );
    assert.ok(
      computerClass.constructorSignature1,
      "Вторая сигнатура конструктора не найдена"
    );
    assert.ok(
      computerClass.constructor,
      "Основная реализация конструктора не найдена"
    );

    // Проверка параметров первой сигнатуры (color: string)
    const sig0Params = computerClass.constructorSignature0.params;
    assert.strictEqual(sig0Params.length, 4, "Должно быть 4 параметра");
    assert.strictEqual(
      Object.keys(sig0Params[3])[0],
      "color",
      "Последний параметр должен называться 'color'"
    );
    assert.strictEqual(
      sig0Params[3].color.types[0],
      "string",
      "Параметр color должен быть string"
    );

    // // Проверка параметров второй сигнатуры (id: number)
    const sig1Params = computerClass.constructorSignature1.params;
    assert.strictEqual(sig1Params.length, 4, "Должно быть 4 параметра");
    assert.strictEqual(
      Object.keys(sig1Params[3])[0],
      "id",
      "Последний параметр должен называться 'id'"
    );
    assert.strictEqual(
      sig1Params[3].id.types[0],
      "number",
      "Параметр id должен быть number"
    );

    // // Проверка основной реализации (someThing: string | number)
    const mainConstructor = computerClass.constructor;
    assert.strictEqual(
      mainConstructor.params.length,
      4,
      "Должно быть 4 параметра"
    );
    assert.strictEqual(
      Object.keys(mainConstructor.params[3])[0],
      "someThing",
      "Последний параметр должен называться 'someThing'"
    );
    assert.deepStrictEqual(
      mainConstructor.params[3].someThing.types,
      ["string | number"],
      "Параметр someThing должен быть string | number"
    );

    // Проверка тела конструктора
    assert.strictEqual(
      typeof mainConstructor.body,
      "string",
      "Тело конструктора должно быть строкой"
    );
    assert.ok(
      mainConstructor.body.includes("this.name = name"),
      "Тело конструктора должно содержать инициализацию name"
    );
  });

  it("Свойства класса должны иметь правильные значения по умолчанию", function () {
    const computerClass = allVariables.classes["Computer"];
    assert.strictEqual(
      computerClass.color.value,
      "blue",
      "Значение по умолчанию для color должно быть 'blue'"
    );
  });
});
