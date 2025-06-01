const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

describe("Type Assertions Exercise", function () {
  describe("Базовые type assertions", function () {
    it("должен найти userInput с type assertion", function () {
      assert.ok(allVariables.variables["userInput"]);
      assert.ok(allVariables.variables["userInput"].typeAssertion);
      assert.strictEqual(
        allVariables.variables["userInput"].typeAssertion.operator,
        "as"
      );
      assert.strictEqual(
        allVariables.variables["userInput"].typeAssertion.type,
        "string"
      );
    });

    it("должен найти userId с двойным type assertion", function () {
      assert.ok(allVariables.variables["userId"]);
      assert.ok(allVariables.variables["userId"].typeAssertion);
      assert.strictEqual(
        allVariables.variables["userId"].typeAssertion.operator,
        "as"
      );
    });

    it("должен найти apiData с any assertion", function () {
      assert.ok(allVariables.variables["apiData"]);
      assert.ok(allVariables.variables["apiData"].typeAssertion);
      assert.strictEqual(
        allVariables.variables["apiData"].typeAssertion.operator,
        "as"
      );
      assert.strictEqual(
        allVariables.variables["apiData"].typeAssertion.type,
        "any"
      );
    });
  });

  describe("As const assertions", function () {
    it("должен найти appConfig с as const", function () {
      assert.ok(allVariables.variables["appConfig"]);
      assert.ok(allVariables.variables["appConfig"].typeAssertion);
      assert.strictEqual(
        allVariables.variables["appConfig"].typeAssertion.operator,
        "as"
      );
      assert.strictEqual(
        allVariables.variables["appConfig"].typeAssertion.type,
        "const"
      );
    });

    it("должен найти statusCodes с as const", function () {
      assert.ok(allVariables.variables["statusCodes"]);
      assert.ok(allVariables.variables["statusCodes"].typeAssertion);
      assert.strictEqual(
        allVariables.variables["statusCodes"].typeAssertion.operator,
        "as"
      );
      assert.strictEqual(
        allVariables.variables["statusCodes"].typeAssertion.type,
        "const"
      );
    });

    it("должен найти allowedRoles с as const", function () {
      assert.ok(allVariables.variables["allowedRoles"]);
      assert.ok(allVariables.variables["allowedRoles"].typeAssertion);
      assert.strictEqual(
        allVariables.variables["allowedRoles"].typeAssertion.operator,
        "as"
      );
      assert.strictEqual(
        allVariables.variables["allowedRoles"].typeAssertion.type,
        "const"
      );
    });

    it("должен найти themeConfig с as const", function () {
      assert.ok(allVariables.variables["themeConfig"]);
      assert.ok(allVariables.variables["themeConfig"].typeAssertion);
      assert.strictEqual(
        allVariables.variables["themeConfig"].typeAssertion.operator,
        "as"
      );
      assert.strictEqual(
        allVariables.variables["themeConfig"].typeAssertion.type,
        "const"
      );
    });
  });

  describe("Interface assertions", function () {
    it("должен найти user с User assertion", function () {
      assert.ok(allVariables.variables["user"]);
      assert.ok(allVariables.variables["user"].typeAssertion);
      assert.strictEqual(
        allVariables.variables["user"].typeAssertion.operator,
        "as"
      );
      assert.strictEqual(
        allVariables.variables["user"].typeAssertion.type,
        "User"
      );
    });

    it("должен найти usersResponse с ApiResponse assertion", function () {
      assert.ok(allVariables.variables["usersResponse"]);
      assert.ok(allVariables.variables["usersResponse"].typeAssertion);
      assert.strictEqual(
        allVariables.variables["usersResponse"].typeAssertion.operator,
        "as"
      );
      assert.ok(
        allVariables.variables["usersResponse"].typeAssertion.type.includes(
          "ApiResponse"
        )
      );
    });
  });

  describe("Readonly assertions", function () {
    it("должен найти readonlyNumbers с readonly assertion", function () {
      assert.ok(allVariables.variables["readonlyNumbers"]);
      assert.ok(allVariables.variables["readonlyNumbers"].typeAssertion);
      assert.strictEqual(
        allVariables.variables["readonlyNumbers"].typeAssertion.operator,
        "as"
      );
      assert.ok(
        allVariables.variables["readonlyNumbers"].typeAssertion.type.includes(
          "readonly"
        )
      );
    });

    it("должен найти readonlyConfig с as const", function () {
      assert.ok(allVariables.variables["readonlyConfig"]);
      assert.ok(allVariables.variables["readonlyConfig"].typeAssertion);
      assert.strictEqual(
        allVariables.variables["readonlyConfig"].typeAssertion.operator,
        "as"
      );
      assert.strictEqual(
        allVariables.variables["readonlyConfig"].typeAssertion.type,
        "const"
      );
    });
  });

  describe("Union type assertions", function () {
    it("должен найти типы Environment и LogLevel", function () {
      assert.ok(allVariables.types["Environment"]);
      assert.ok(allVariables.types["LogLevel"]);
    });

    it("должен найти currentEnv с Environment assertion", function () {
      assert.ok(allVariables.variables["currentEnv"]);
      assert.ok(allVariables.variables["currentEnv"].typeAssertion);
      assert.strictEqual(
        allVariables.variables["currentEnv"].typeAssertion.operator,
        "as"
      );
      assert.strictEqual(
        allVariables.variables["currentEnv"].typeAssertion.type,
        "Environment"
      );
    });

    it("должен найти logLevel с LogLevel assertion", function () {
      assert.ok(allVariables.variables["logLevel"]);
      assert.ok(allVariables.variables["logLevel"].typeAssertion);
      assert.strictEqual(
        allVariables.variables["logLevel"].typeAssertion.operator,
        "as"
      );
      assert.strictEqual(
        allVariables.variables["logLevel"].typeAssertion.type,
        "LogLevel"
      );
    });
  });

  describe("Функция и сложные случаи", function () {
    it("должен найти функцию fetchData", function () {
      assert.ok(allVariables.functions["fetchData"]);
      assert.strictEqual(
        allVariables.functions["fetchData"].returnType,
        "unknown"
      );
    });

    it("должен найти typedData с object assertion", function () {
      assert.ok(allVariables.variables["typedData"]);
      assert.ok(allVariables.variables["typedData"].typeAssertion);
      assert.strictEqual(
        allVariables.variables["typedData"].typeAssertion.operator,
        "as"
      );
      assert.ok(
        allVariables.variables["typedData"].typeAssertion.type.includes("data")
      );
    });
  });
});
