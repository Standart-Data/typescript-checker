const assert = require("assert");
const { checkFiles } = require("../../testUtils");

// Проверяем файлы урока
const { result: resultFiles, metadata: allVariables } = checkFiles([
  "EmployeeCard.tsx",
  "EmployeeCard.module.css",
  "EmployeeCard.module.css.d.ts",
]);

describe("Строгая декларация EmployeeCard.module.css", function () {
  it("создаёт декларацию через declare module", function () {
    const dtsFile = allVariables.files["EmployeeCard.module.css.d.ts"];
    assert.ok(
      dtsFile,
      "Файл EmployeeCard.module.css.d.ts должен быть распознан"
    );
    assert.ok(dtsFile.modules, "Должны быть найдены модули");
    assert.ok(
      dtsFile.modules["./EmployeeCard.module.css"],
      "Должен быть модуль ./EmployeeCard.module.css"
    );
    assert.ok(
      dtsFile.modules["./EmployeeCard.module.css"].isDeclared,
      "Модуль должен быть объявлен через declare"
    );
  });

  it("экспортируется default объект только с avatar и highlightName", function () {
    const cssModule =
      allVariables.files["EmployeeCard.module.css.d.ts"].modules[
        "./EmployeeCard.module.css"
      ];
    assert.ok(cssModule.variables.styles, "Должна быть переменная styles");

    const stylesType = cssModule.variables.styles.type;
    assert.ok(
      stylesType.includes("avatar"),
      "Тип должен содержать поле avatar"
    );
    assert.ok(
      stylesType.includes("highlightName"),
      "Тип должен содержать поле highlightName"
    );
    assert.ok(stylesType.includes("string"), "Поля должны быть типа string");
    assert.ok(
      cssModule.variables.styles.isExported,
      "styles должен быть экспортирован"
    );
  });

  it("нет других полей кроме avatar и highlightName", function () {
    const stylesType =
      allVariables.files["EmployeeCard.module.css.d.ts"].modules[
        "./EmployeeCard.module.css"
      ].variables.styles.type;

    const fieldMatches =
      stylesType.match(/(readonly\s+)?(\w+):\s*string/g) || [];
    const fields = fieldMatches.map((f) => {
      return f.replace(/readonly\s+/, "").replace(/:\s*string/, "");
    });

    assert.deepStrictEqual(
      fields.sort(),
      ["avatar", "highlightName"].sort(),
      "Должны быть только поля avatar и highlightName"
    );
  });

  it("highlight-name корректно маппится в highlightName", function () {
    const cssClasses = allVariables.files["EmployeeCard.module.css"].classes;
    const stylesType =
      allVariables.files["EmployeeCard.module.css.d.ts"].modules[
        "./EmployeeCard.module.css"
      ].variables.styles.type;

    assert.ok(
      cssClasses["highlight-name"],
      "В CSS должен быть класс .highlight-name"
    );

    assert.ok(
      stylesType.includes("highlightName"),
      "В типах должно быть поле highlightName"
    );
    assert.ok(
      !stylesType.includes("highlight-name"),
      "В типах не должно быть поля highlight-name"
    );
  });

  it("shadowEffect не экспортируется", function () {
    const cssClasses = allVariables.files["EmployeeCard.module.css"].classes;
    const stylesType =
      allVariables.files["EmployeeCard.module.css.d.ts"].modules[
        "./EmployeeCard.module.css"
      ].variables.styles.type;

    assert.ok(
      cssClasses["shadow-effect"],
      "В CSS должен быть класс .shadow-effect"
    );

    assert.ok(
      !stylesType.includes("shadowEffect"),
      "shadowEffect не должен быть в типах"
    );
    assert.ok(
      !stylesType.includes("shadow-effect"),
      "shadow-effect не должен быть в типах"
    );
  });
});
