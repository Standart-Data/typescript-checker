const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

describe("Interface Parsing Tests", function () {
  it("Интерфейс Person корректно обрабатывается", function () {
    assert.ok(allVariables.interfaces["Person"], "Интерфейс Person не найден");

    const personInterface = allVariables.interfaces["Person"];
    assert.deepStrictEqual(
      personInterface.properties,
      {
        name: "string",
        phoneNumber: "string",
      },
      "Свойства интерфейса Person не совпадают"
    );
  });

  it("Интерфейс Car корректно обрабатывается", function () {
    assert.ok(allVariables.interfaces["Car"], "Интерфейс Car не найден");

    const carInterface = allVariables.interfaces["Car"];
    assert.deepStrictEqual(
      carInterface.properties,
      {
        brand: "string",
        model: "string",
        plateNumber: "string",
        bodyType: '"sedan" | "coupe" | "suv"',
      },
      "Свойства интерфейса Car не совпадают"
    );
  });

  it("Интерфейс Client корректно обрабатывается и расширяет Person и Car", function () {
    assert.ok(allVariables.interfaces["Client"], "Интерфейс Client не найден");

    const clientInterface = allVariables.interfaces["Client"];
    assert.deepStrictEqual(
      clientInterface.properties,
      {
        appointmentTime: "string",
      },
      "Свойства интерфейса Client не совпадают"
    );

    assert.deepStrictEqual(
      clientInterface.extendedBy,
      ["Person", "Car"],
      "Интерфейс Client должен расширять Person и Car"
    );
  });
});
