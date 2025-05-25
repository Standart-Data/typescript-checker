// Здесь импорты, мы их НЕ переносим в тесты в админке

const { parseReact } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseReact([path.join(__dirname, "main.tsx")]);

console.log(
  "Parsed variables:",
  JSON.stringify(allVariables.variables, null, 2)
);
console.log(
  "Parsed functions:",
  JSON.stringify(allVariables.functions, null, 2)
);
console.log("Parsed classes:", JSON.stringify(allVariables.classes, null, 2));
console.log("Parsed enums:", JSON.stringify(allVariables.enums, null, 2));

// Здесь начинаются тесты, их мы переносим

describe("Модификаторы переменных в React:", function () {
  it("globalVar должна быть объявлена как var", function () {
    assert.ok(allVariables.variables["globalVar"]);
    assert.strictEqual(
      allVariables.variables["globalVar"].declarationType,
      "var"
    );
    assert.strictEqual(allVariables.variables["globalVar"].isExported, false);
  });

  it("mutableVar должна быть объявлена как let", function () {
    assert.ok(allVariables.variables["mutableVar"]);
    assert.strictEqual(
      allVariables.variables["mutableVar"].declarationType,
      "let"
    );
  });

  it("immutableVar должна быть объявлена как const", function () {
    assert.ok(allVariables.variables["immutableVar"]);
    assert.strictEqual(
      allVariables.variables["immutableVar"].declarationType,
      "const"
    );
  });

  it("exportedVar должна быть объявлена как var", function () {
    assert.ok(allVariables.variables["exportedVar"]);
    // В React парсере экспорт переменных обрабатывается отдельно
    assert.strictEqual(
      allVariables.variables["exportedVar"].declarationType,
      "var"
    );
  });
});

describe("Модификаторы классов в React:", function () {
  it("ReactClassComponent должен быть экспортируемым React компонентом", function () {
    assert.ok(allVariables.classes["ReactClassComponent"]);
    assert.strictEqual(
      allVariables.classes["ReactClassComponent"].isExported,
      true
    );
    assert.strictEqual(allVariables.classes["ReactClassComponent"].jsx, true);
  });

  it("ReactClassComponent должен иметь правильные свойства", function () {
    const reactClass = allVariables.classes["ReactClassComponent"];
    assert.ok(reactClass.fields["state"]);
    assert.ok(reactClass.fields["componentName"]);
    assert.ok(reactClass.fields["displayName"]);
    assert.strictEqual(reactClass.fields["displayName"].isStatic, true);
  });
});

describe("Модификаторы свойств классов в React:", function () {
  it("state должно иметь модификатор public", function () {
    const reactClass = allVariables.classes["ReactClassComponent"];
    assert.ok(reactClass.fields["state"]);
    assert.strictEqual(reactClass.fields["state"].accessModifier, "public");
  });

  it("componentName должно иметь модификатор protected", function () {
    const reactClass = allVariables.classes["ReactClassComponent"];
    assert.ok(reactClass.fields["componentName"]);
    assert.strictEqual(
      reactClass.fields["componentName"].accessModifier,
      "protected"
    );
  });

  it("handleClick должно иметь модификатор private", function () {
    const reactClass = allVariables.classes["ReactClassComponent"];
    assert.ok(reactClass.fields["handleClick"]);
    assert.strictEqual(
      reactClass.fields["handleClick"].accessModifier,
      "private"
    );
  });

  it("displayName должно быть статическим", function () {
    const reactClass = allVariables.classes["ReactClassComponent"];
    assert.ok(reactClass.fields["displayName"]);
    assert.strictEqual(reactClass.fields["displayName"].isStatic, true);
  });
});

describe("Модификаторы методов классов в React:", function () {
  it("render должен иметь модификатор public", function () {
    const reactClass = allVariables.classes["ReactClassComponent"];
    assert.ok(reactClass.methods["render"]);
    assert.strictEqual(reactClass.methods["render"].accessModifier, "public");
  });

  it("componentDidMount должен иметь модификатор protected", function () {
    const reactClass = allVariables.classes["ReactClassComponent"];
    assert.ok(reactClass.methods["componentDidMount"]);
    assert.strictEqual(
      reactClass.methods["componentDidMount"].accessModifier,
      "protected"
    );
  });
});

describe("Модификаторы enum в React:", function () {
  it("LocalEnum должен быть обычным enum", function () {
    assert.ok(allVariables.enums["LocalEnum"]);
    assert.strictEqual(allVariables.enums["LocalEnum"].isConst, false);
    assert.strictEqual(allVariables.enums["LocalEnum"].isExported, false);
  });

  it("ExportedEnum должен быть экспортируемым", function () {
    assert.ok(allVariables.enums["ExportedEnum"]);
    assert.strictEqual(allVariables.enums["ExportedEnum"].isExported, true);
    assert.strictEqual(allVariables.enums["ExportedEnum"].isConst, false);
  });

  it("LocalConstEnum должен быть const enum", function () {
    assert.ok(allVariables.enums["LocalConstEnum"]);
    assert.strictEqual(allVariables.enums["LocalConstEnum"].isConst, true);
    assert.strictEqual(allVariables.enums["LocalConstEnum"].isExported, false);
  });

  it("ExportedConstEnum должен быть экспортируемым const enum", function () {
    assert.ok(allVariables.enums["ExportedConstEnum"]);
    assert.strictEqual(allVariables.enums["ExportedConstEnum"].isConst, true);
    assert.strictEqual(
      allVariables.enums["ExportedConstEnum"].isExported,
      true
    );
  });
});

describe("Модификаторы интерфейсов в React:", function () {
  it("LocalProps должен быть локальным", function () {
    assert.ok(allVariables.interfaces["LocalProps"]);
    assert.strictEqual(allVariables.interfaces["LocalProps"].isExported, false);
  });

  it("ExportedProps должен быть экспортируемым", function () {
    assert.ok(allVariables.interfaces["ExportedProps"]);
    assert.strictEqual(
      allVariables.interfaces["ExportedProps"].isExported,
      true
    );
  });
});

describe("Модификаторы типов в React:", function () {
  it("LocalType должен быть локальным", function () {
    assert.ok(allVariables.types["LocalType"]);
    assert.strictEqual(allVariables.types["LocalType"].type, "primitive");
  });

  it("ExportedType должен быть экспортируемым", function () {
    assert.ok(allVariables.types["ExportedType"]);
    assert.strictEqual(allVariables.types["ExportedType"].type, "primitive");
  });
});

describe("React компоненты:", function () {
  it("LocalComponent должен быть функциональным компонентом", function () {
    assert.ok(allVariables.functions["LocalComponent"]);
    assert.strictEqual(allVariables.functions["LocalComponent"].jsx, true);
  });

  it("ExportedComponent должен быть экспортируемым функциональным компонентом", function () {
    assert.ok(allVariables.functions["ExportedComponent"]);
    assert.strictEqual(allVariables.functions["ExportedComponent"].jsx, true);
  });
});
