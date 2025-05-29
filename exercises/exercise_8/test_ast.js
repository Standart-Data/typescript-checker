const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

describe("TypeScript Type Checking for User", function () {
  it("Тип User имеет корректные ключи и типы", function () {
    const userType = allVariables.types["User"];
    assert.strictEqual(userType.type, "object");
    assert.strictEqual(userType.properties.id, "number");
    assert.strictEqual(userType.properties.name, "string");
    assert.strictEqual(userType.properties.email, "string");
  });

  it("В коде объявлена функция printUserInfo с параметром типа User", function () {
    const functionParams = allVariables.functions["printUserInfo"]["params"];
    const userParam = functionParams.find((param) => param.name === "user");
    assert.strictEqual(userParam.type, "User");
  });

  it("Функция printUserInfo имеет возвращаемый тип void", function () {
    assert.ok(
      allVariables.functions["printUserInfo"]["returnResult"].includes("void")
    );
  });
});
