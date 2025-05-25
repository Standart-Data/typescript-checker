const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

describe("Access Modifiers Test", function () {
  it("Класс Window имеет модификаторы доступа у свойств", function () {
    assert.ok(allVariables.classes["Window"]);
    const windowClass = allVariables.classes["Window"];

    assert.strictEqual(windowClass["id"].modificator, "private");
    assert.strictEqual(windowClass["name"].modificator, "protected");
    assert.strictEqual(windowClass["length"].modificator, "opened");
    assert.strictEqual(windowClass["access"].modificator, "readonly");
  });

  it("Класс Icon имеет модификаторы доступа у свойств", function () {
    assert.ok(allVariables.classes["Icon"]);
    const iconClass = allVariables.classes["Icon"];

    assert.strictEqual(iconClass["id"].modificator, "private");
    assert.strictEqual(iconClass["name"].modificator, "protected");
    assert.strictEqual(iconClass["title"].modificator, "opened");
  });
});
