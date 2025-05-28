// Импорты для тестирования
const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

// Парсим d.ts файл
const allVariables = parseTypeScript([path.join(__dirname, "main.d.ts")]);
console.log(allVariables, "parsed types");

describe("Интерфейс User:", function () {
  it("Создан интерфейс User", function () {
    assert.ok(allVariables.interfaces["User"], "Интерфейс User не найден");
  });

  it("Интерфейс User содержит поле id типа number", function () {
    const userInterface = allVariables.interfaces["User"];
    assert.ok(userInterface.properties["id"], "Поле id не найдено");
    assert.equal(
      userInterface.properties["id"].type,
      "number",
      "Поле id должно быть типа number"
    );
  });

  it("Интерфейс User содержит поле name типа string", function () {
    const userInterface = allVariables.interfaces["User"];
    assert.ok(userInterface.properties["name"], "Поле name не найдено");
    assert.equal(
      userInterface.properties["name"].type,
      "string",
      "Поле name должно быть типа string"
    );
  });

  it("Интерфейс User содержит опциональное поле email типа string", function () {
    const userInterface = allVariables.interfaces["User"];
    assert.ok(userInterface.properties["email"], "Поле email не найдено");
    assert.equal(
      userInterface.properties["email"].type,
      "string",
      "Поле email должно быть типа string"
    );
    assert.ok(
      userInterface.properties["email"].optional,
      "Поле email должно быть опциональным"
    );
  });
});

describe("Тип UserRole:", function () {
  it("Создан тип UserRole", function () {
    assert.ok(allVariables.types["UserRole"], "Тип UserRole не найден");
  });

  it("UserRole включает вариант 'admin'", function () {
    const userRoleType = allVariables.types["UserRole"];

    // Проверяем значение типа напрямую через definition или value
    const typeValue = userRoleType.definition || userRoleType.value || "";
    assert.ok(
      typeValue.includes('"admin"') || typeValue.includes("'admin'"),
      "UserRole должен включать вариант 'admin'"
    );
  });

  it("UserRole включает вариант 'editor'", function () {
    const userRoleType = allVariables.types["UserRole"];

    const typeValue = userRoleType.definition || userRoleType.value || "";
    assert.ok(
      typeValue.includes('"editor"') || typeValue.includes("'editor'"),
      "UserRole должен включать вариант 'editor'"
    );
  });

  it("UserRole включает вариант 'viewer'", function () {
    const userRoleType = allVariables.types["UserRole"];

    const typeValue = userRoleType.definition || userRoleType.value || "";
    assert.ok(
      typeValue.includes('"viewer"') || typeValue.includes("'viewer'"),
      "UserRole должен включать вариант 'viewer'"
    );
  });
});

describe("Интерфейс UserWithRole:", function () {
  it("Создан интерфейс UserWithRole, расширяющий User", function () {
    assert.ok(
      allVariables.interfaces["UserWithRole"],
      "Интерфейс UserWithRole не найден"
    );

    assert.ok(
      allVariables.interfaces["UserWithRole"].extends &&
        allVariables.interfaces["UserWithRole"].extends.includes("User"),
      "UserWithRole должен расширять интерфейс User"
    );
  });

  it("UserWithRole содержит поле role типа UserRole", function () {
    const userWithRoleInterface = allVariables.interfaces["UserWithRole"];
    assert.ok(userWithRoleInterface.properties["role"], "Поле role не найдено");

    assert.equal(
      userWithRoleInterface.properties["role"].type,
      "UserRole",
      "Поле role должно быть типа UserRole"
    );
  });
});
