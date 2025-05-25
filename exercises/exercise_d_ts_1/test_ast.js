// Импорты для тестирования
const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

// Парсим d.ts файл
const allTypes = parseTypeScript([path.join(__dirname, "main.d.ts")]);
console.log(allTypes, "parsed types");

describe("Интерфейс User:", function () {
  it("Создан интерфейс User", function () {
    assert.ok(allTypes.interfaces["User"], "Интерфейс User не найден");
  });

  it("Интерфейс User содержит поле id типа number", function () {
    assert.equal(
      allTypes.interfaces["User"].properties["id"],
      "number",
      "Поле id должно быть типа number"
    );
  });

  it("Интерфейс User содержит поле name типа string", function () {
    assert.equal(
      allTypes.interfaces["User"].properties["name"],
      "string",
      "Поле name должно быть типа string"
    );
  });

  it("Интерфейс User содержит опциональное поле email типа string", function () {
    assert.ok(
      allTypes.interfaces["User"].properties["email"],
      "Поле email не найдено"
    );
    assert.equal(
      allTypes.interfaces["User"].properties["email"],
      "string",
      "Поле email должно быть типа string"
    );
  });
});

describe("Тип UserRole:", function () {
  it("Создан тип UserRole", function () {
    assert.ok(allTypes.types["UserRole"], "Тип UserRole не найден");
  });

  it("UserRole включает вариант 'admin'", function () {
    const userRoleType = allTypes.types["UserRole"];

    let containsAdmin = false;
    if (userRoleType.type === "combined") {
      containsAdmin = userRoleType.possibleTypes.some(
        (t) => t.value && t.value.includes("admin")
      );
    } else if (userRoleType.value) {
      containsAdmin = userRoleType.value.includes("admin");
    }

    assert.ok(containsAdmin, "UserRole должен включать вариант 'admin'");
  });

  it("UserRole включает вариант 'editor'", function () {
    const userRoleType = allTypes.types["UserRole"];

    let containsEditor = false;
    if (userRoleType.type === "combined") {
      containsEditor = userRoleType.possibleTypes.some(
        (t) => t.value && t.value.includes("editor")
      );
    } else if (userRoleType.value) {
      containsEditor = userRoleType.value.includes("editor");
    }

    assert.ok(containsEditor, "UserRole должен включать вариант 'editor'");
  });

  it("UserRole включает вариант 'viewer'", function () {
    const userRoleType = allTypes.types["UserRole"];

    let containsViewer = false;
    if (userRoleType.type === "combined") {
      containsViewer = userRoleType.possibleTypes.some(
        (t) => t.value && t.value.includes("viewer")
      );
    } else if (userRoleType.value) {
      containsViewer = userRoleType.value.includes("viewer");
    }

    assert.ok(containsViewer, "UserRole должен включать вариант 'viewer'");
  });
});

describe("Интерфейс UserWithRole:", function () {
  it("Создан интерфейс UserWithRole, расширяющий User", function () {
    assert.ok(
      allTypes.interfaces["UserWithRole"],
      "Интерфейс UserWithRole не найден"
    );

    assert.ok(
      allTypes.interfaces["UserWithRole"].extendedBy.includes("User"),
      "UserWithRole должен расширять интерфейс User"
    );
  });

  it("UserWithRole содержит поле role типа UserRole", function () {
    assert.ok(
      allTypes.interfaces["UserWithRole"].properties["role"],
      "Поле role не найдено"
    );

    assert.ok(
      allTypes.interfaces["UserWithRole"].properties["role"].includes(
        "UserRole"
      ),
      "Поле role должно быть типа UserRole"
    );
  });
});
