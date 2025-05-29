const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

describe("First test", function () {
  it("В коде объявлена функция showPersonDetails c возвращаемым типом void", function () {
    assert.ok(
      allVariables.functions["showPersonDetails"]["returnResult"].includes(
        "void"
      )
    );
  });

  it("В коде объявлена функция move c параметром person, где тип Person", function () {
    assert.ok(
      allVariables.functions["showPersonDetails"]["params"][0].name.includes(
        "person"
      ) &&
        allVariables.functions["showPersonDetails"]["params"][0].type.includes(
          "Person"
        )
    );
  });

  it("В коде объявлена функция showPersonDetails c возвращаемым типом void", function () {
    assert.ok(
      allVariables.functions["showPersonDetails"]["returnResult"].includes(
        "void"
      )
    );
  });

  it("Тип Address имеет корректные ключи и типы", function () {
    const address = allVariables.types["Address"];
    assert.strictEqual(address.type, "object");
    assert.strictEqual(address.properties.street, "string");
    assert.strictEqual(address.properties.city, "string");
    assert.strictEqual(address.properties.zipcode, "string");
  });

  it("Тип a имеет корректный тип", function () {
    const aType = allVariables.types["a"];
    assert.strictEqual(aType.value, "string");
    assert.strictEqual(aType.type, "simple");
  });

  it("Тип User имеет корректные ключи и типы, а также может быть строкой", function () {
    const userType = allVariables.types["User"];
    assert.strictEqual(userType.type, "combined");

    const objectType = userType.possibleTypes.find((t) => t.type === "object");
    assert.ok(objectType);
    assert.strictEqual(objectType.properties.name, "string");
    assert.strictEqual(objectType.properties.address, "Address");

    const stringType = userType.possibleTypes.find(
      (t) => t.type === "simple" && t.value === "string"
    );
    assert.ok(stringType);
  });
});
