const { parseReact } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseReact([path.join(__dirname, "main.tsx")]);

describe("Интерфейс GreetingProps:", function () {
  it("Создан интерфейс GreetingProps", function () {
    assert.ok(
      allVariables.types["GreetingProps"],
      "Интерфейс GreetingProps не найден"
    );
  });

  it("Интерфейс содержит поле name типа string", function () {
    const nameProperty = allVariables.types["GreetingProps"].properties.find(
      (prop) => prop.name === "name"
    );
    assert.ok(nameProperty, "Поле name не найдено");
    assert.equal(
      nameProperty.type,
      "string",
      "Поле name должно быть типа string"
    );
  });

  it("Интерфейс содержит поле age типа number", function () {
    const ageProperty = allVariables.types["GreetingProps"].properties.find(
      (prop) => prop.name === "age"
    );
    assert.ok(ageProperty, "Поле age не найдено");
    assert.equal(
      ageProperty.type,
      "number",
      "Поле age должно быть типа number"
    );
  });

  it("Интерфейс содержит опциональное поле isActive типа boolean", function () {
    const isActiveProperty = allVariables.types[
      "GreetingProps"
    ].properties.find((prop) => prop.name === "isActive");
    assert.ok(isActiveProperty, "Поле isActive не найдено");
    assert.equal(
      isActiveProperty.type,
      "boolean",
      "Поле isActive должно быть типа boolean"
    );
  });
});

describe("Компонент Greeting:", function () {
  it("Компонент Greeting использует типизацию GreetingProps", function () {
    const component = allVariables.components["Greeting"];
    assert.ok(component, "Компонент Greeting не найден");

    // Проверяем, что в props компонента присутствуют все необходимые поля
    const props = component.props;
    assert.ok(
      props.some((prop) =>
        ["props", "{ name, age, isActive }"].includes(prop.name)
      ),
      "Компонент должен принимать типизированные props"
    );
  });

  it("Компонент Greeting имеет правильную типизацию FunctionComponent<GreetingProps>", function () {
    const component = allVariables.components["Greeting"];
    const componentCode = component.code;

    // Проверяем наличие типизации FunctionComponent или React.FC с GreetingProps
    const hasCorrectTyping =
      componentCode.includes("FunctionComponent<GreetingProps>") ||
      componentCode.includes("FC<GreetingProps>") ||
      componentCode.includes("React.FunctionComponent<GreetingProps>") ||
      componentCode.includes("React.FC<GreetingProps>");

    assert.ok(
      hasCorrectTyping,
      "Компонент должен использовать типизацию FunctionComponent<GreetingProps> или FC<GreetingProps>"
    );

    // Проверяем что импортирован нужный тип
    assert.ok(
      allVariables.variables["FunctionComponent"] ||
        allVariables.variables["FC"] ||
        componentCode.includes("import React") ||
        componentCode.includes("import * as React"),
      "Необходимо импортировать тип FunctionComponent или FC из React"
    );
  });

  it("Компонент Greeting корректно использует переданные props", function () {
    const component = allVariables.components["Greeting"];
    const jsxCode = component.returns;

    // Проверяем, что JSX содержит использование props
    assert.ok(
      jsxCode.includes("props.name") || jsxCode.includes("{name}"),
      "В компоненте должно использоваться свойство name"
    );
    assert.ok(
      jsxCode.includes("props.age") || jsxCode.includes("{age}"),
      "В компоненте должно использоваться свойство age"
    );
    assert.ok(
      jsxCode.includes("props.isActive") || jsxCode.includes("{isActive}"),
      "В компоненте должно использоваться свойство isActive"
    );
  });
});
