// Здесь импорты, мы их НЕ переносим в тесты в админке

const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

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

describe("Модификаторы переменных:", function () {
  it("globalVar должна быть объявлена как var", function () {
    assert.ok(allVariables.variables["globalVar"]);
    assert.strictEqual(
      allVariables.variables["globalVar"].declarationType,
      "var"
    );
    assert.strictEqual(allVariables.variables["globalVar"].isExported, false);
    assert.strictEqual(allVariables.variables["globalVar"].isDeclared, false);
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
    assert.strictEqual(allVariables.variables["immutableVar"].isConst, true);
  });

  it("exportedVar должна быть экспортируемой", function () {
    assert.ok(allVariables.variables["exportedVar"]);
    assert.strictEqual(allVariables.variables["exportedVar"].isExported, true);
    assert.strictEqual(
      allVariables.variables["exportedVar"].declarationType,
      "var"
    );
  });

  it("declaredVar должна быть объявлением", function () {
    assert.ok(allVariables.variables["declaredVar"]);
    assert.strictEqual(allVariables.variables["declaredVar"].isDeclared, true);
    assert.strictEqual(
      allVariables.variables["declaredVar"].declarationType,
      "var"
    );
  });
});

describe("Модификаторы функций:", function () {
  it("asyncFunction должна быть асинхронной", function () {
    assert.ok(allVariables.functions["asyncFunction"]);
    assert.strictEqual(allVariables.functions["asyncFunction"].isAsync, true);
    assert.strictEqual(
      allVariables.functions["asyncFunction"].isExported,
      false
    );
  });

  it("generatorFunction должна быть генератором", function () {
    assert.ok(allVariables.functions["generatorFunction"]);
    assert.strictEqual(
      allVariables.functions["generatorFunction"].isGenerator,
      true
    );
  });

  it("exportedFunction должна быть экспортируемой", function () {
    assert.ok(allVariables.functions["exportedFunction"]);
    assert.strictEqual(
      allVariables.functions["exportedFunction"].isExported,
      true
    );
  });

  it("defaultFunction должна быть экспортом по умолчанию", function () {
    assert.ok(allVariables.functions["defaultFunction"]);
    assert.strictEqual(
      allVariables.functions["defaultFunction"].isDefault,
      true
    );
    assert.strictEqual(
      allVariables.functions["defaultFunction"].isExported,
      true
    );
  });

  it("declaredFunction должна быть объявлением", function () {
    assert.ok(allVariables.functions["declaredFunction"]);
    assert.strictEqual(
      allVariables.functions["declaredFunction"].isDeclared,
      true
    );
  });
});

describe("Модификаторы классов:", function () {
  it("AbstractBase должен быть абстрактным", function () {
    assert.ok(allVariables.classes["AbstractBase"]);
    assert.strictEqual(allVariables.classes["AbstractBase"].isAbstract, true);
    assert.strictEqual(allVariables.classes["AbstractBase"].isExported, false);
  });

  it("ConcreteClass должен быть обычным классом", function () {
    assert.ok(allVariables.classes["ConcreteClass"]);
    assert.strictEqual(allVariables.classes["ConcreteClass"].isAbstract, false);
  });

  it("ExportedClass должен быть экспортируемым", function () {
    assert.ok(allVariables.classes["ExportedClass"]);
    assert.strictEqual(allVariables.classes["ExportedClass"].isExported, true);
  });

  it("ExportedAbstractClass должен быть экспортируемым и абстрактным", function () {
    assert.ok(allVariables.classes["ExportedAbstractClass"]);
    assert.strictEqual(
      allVariables.classes["ExportedAbstractClass"].isAbstract,
      true
    );
    assert.strictEqual(
      allVariables.classes["ExportedAbstractClass"].isExported,
      true
    );
  });
});

describe("Модификаторы свойств классов:", function () {
  it("publicProperty должно иметь модификатор public", function () {
    const abstractBase = allVariables.classes["AbstractBase"];
    assert.ok(abstractBase.properties["publicProperty"]);
    assert.strictEqual(
      abstractBase.properties["publicProperty"].accessModifier,
      "public"
    );
  });

  it("privateProperty должно иметь модификатор private", function () {
    const abstractBase = allVariables.classes["AbstractBase"];
    assert.ok(abstractBase.properties["privateProperty"]);
    assert.strictEqual(
      abstractBase.properties["privateProperty"].accessModifier,
      "private"
    );
  });

  it("protectedProperty должно иметь модификатор protected", function () {
    const abstractBase = allVariables.classes["AbstractBase"];
    assert.ok(abstractBase.properties["protectedProperty"]);
    assert.strictEqual(
      abstractBase.properties["protectedProperty"].accessModifier,
      "protected"
    );
  });

  it("readonlyProperty должно быть readonly", function () {
    const abstractBase = allVariables.classes["AbstractBase"];
    assert.ok(abstractBase.properties["readonlyProperty"]);
    assert.strictEqual(
      abstractBase.properties["readonlyProperty"].isReadonly,
      true
    );
  });

  it("staticProperty должно быть статическим", function () {
    const abstractBase = allVariables.classes["AbstractBase"];
    assert.ok(abstractBase.properties["staticProperty"]);
    assert.strictEqual(
      abstractBase.properties["staticProperty"].isStatic,
      true
    );
  });

  it("abstractProperty должно быть абстрактным", function () {
    const abstractBase = allVariables.classes["AbstractBase"];
    assert.ok(abstractBase.properties["abstractProperty"]);
    assert.strictEqual(
      abstractBase.properties["abstractProperty"].isAbstract,
      true
    );
  });
});

describe("Модификаторы методов классов:", function () {
  it("publicMethod должен иметь модификатор public", function () {
    const abstractBase = allVariables.classes["AbstractBase"];
    assert.ok(abstractBase.methods["publicMethod"]);
    assert.strictEqual(
      abstractBase.methods["publicMethod"].accessModifier,
      "public"
    );
  });

  it("privateMethod должен иметь модификатор private", function () {
    const abstractBase = allVariables.classes["AbstractBase"];
    assert.ok(abstractBase.methods["privateMethod"]);
    assert.strictEqual(
      abstractBase.methods["privateMethod"].accessModifier,
      "private"
    );
  });

  it("protectedMethod должен иметь модификатор protected", function () {
    const abstractBase = allVariables.classes["AbstractBase"];
    assert.ok(abstractBase.methods["protectedMethod"]);
    assert.strictEqual(
      abstractBase.methods["protectedMethod"].accessModifier,
      "protected"
    );
  });

  it("staticMethod должен быть статическим", function () {
    const abstractBase = allVariables.classes["AbstractBase"];
    assert.ok(abstractBase.methods["staticMethod"]);
    assert.strictEqual(abstractBase.methods["staticMethod"].isStatic, true);
  });

  it("asyncMethod должен быть асинхронным", function () {
    const abstractBase = allVariables.classes["AbstractBase"];
    assert.ok(abstractBase.methods["asyncMethod"]);
    assert.strictEqual(abstractBase.methods["asyncMethod"].isAsync, true);
  });

  it("abstractMethod должен быть абстрактным", function () {
    const abstractBase = allVariables.classes["AbstractBase"];
    assert.ok(abstractBase.methods["abstractMethod"]);
    assert.strictEqual(abstractBase.methods["abstractMethod"].isAbstract, true);
  });
});

describe("Модификаторы enum:", function () {
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

  it("DeclaredEnum должен быть объявлением", function () {
    assert.ok(allVariables.enums["DeclaredEnum"]);
    assert.strictEqual(allVariables.enums["DeclaredEnum"].isDeclared, true);
  });
});

describe("Модификаторы интерфейсов:", function () {
  it("LocalInterface должен быть локальным", function () {
    assert.ok(allVariables.interfaces["LocalInterface"]);
    assert.strictEqual(
      allVariables.interfaces["LocalInterface"].isExported,
      false
    );
    assert.strictEqual(
      allVariables.interfaces["LocalInterface"].isDeclared,
      false
    );
  });

  it("ExportedInterface должен быть экспортируемым", function () {
    assert.ok(allVariables.interfaces["ExportedInterface"]);
    assert.strictEqual(
      allVariables.interfaces["ExportedInterface"].isExported,
      true
    );
  });

  it("DeclaredInterface должен быть объявлением", function () {
    assert.ok(allVariables.interfaces["DeclaredInterface"]);
    assert.strictEqual(
      allVariables.interfaces["DeclaredInterface"].isDeclared,
      true
    );
  });
});

describe("Модификаторы типов:", function () {
  it("LocalType должен быть локальным", function () {
    assert.ok(allVariables.types["LocalType"]);
    assert.strictEqual(allVariables.types["LocalType"].isExported, false);
    assert.strictEqual(allVariables.types["LocalType"].isDeclared, false);
  });

  it("ExportedType должен быть экспортируемым", function () {
    assert.ok(allVariables.types["ExportedType"]);
    assert.strictEqual(allVariables.types["ExportedType"].isExported, true);
  });

  it("DeclaredType должен быть объявлением", function () {
    assert.ok(allVariables.types["DeclaredType"]);
    assert.strictEqual(allVariables.types["DeclaredType"].isDeclared, true);
  });
});
