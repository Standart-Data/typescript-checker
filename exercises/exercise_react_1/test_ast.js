const assert = require("assert");
const { checkFiles } = require("../../testUtils");

// Проверяем файл main.tsx, находящийся в той же директории, что и текущий тест
const { metadata: allVariables } = checkFiles(["main.tsx"], __dirname);

// Вспомогательная функция для получения информации о компоненте из allVariables
function getComponentInfo(componentName) {
  if (!allVariables) return null;
  if (allVariables.components && allVariables.components[componentName]) {
    return allVariables.components[componentName];
  }
  if (allVariables.functions && allVariables.functions[componentName]) {
    const func = allVariables.functions[componentName];
    const content =
      func.content || func.body || JSON.stringify(func.node) || "";
    if (
      content.includes("JSXElement") ||
      content.includes("React.createElement") ||
      content.includes("return (")
    ) {
      return func;
    }
  }
  if (allVariables.classes && allVariables.classes[componentName]) {
    const cls = allVariables.classes[componentName];
    if (
      (cls.methods && cls.methods.render) ||
      (cls.heritageClauses &&
        cls.heritageClauses.some(
          (h) =>
            h.types &&
            h.types.some(
              (t) => t.expression && t.expression.escapedText === "Component"
            )
        ))
    ) {
      return cls;
    }
  }
  return null;
}

// Вспомогательная функция для получения информации об интерфейсе или типе из allVariables
function getTypeOrInterfaceInfo(typeName) {
  if (!allVariables) return null;
  if (allVariables.interfaces && allVariables.interfaces[typeName]) {
    return allVariables.interfaces[typeName];
  }
  if (allVariables.types && allVariables.types[typeName]) {
    return allVariables.types[typeName];
  }
  if (allVariables.declarations && allVariables.declarations[typeName]) {
    if (
      allVariables.declarations[typeName].kindString ===
        "InterfaceDeclaration" ||
      (allVariables.declarations[typeName].declaration &&
        allVariables.declarations[typeName].declaration.kindString ===
          "InterfaceDeclaration")
    ) {
      return allVariables.declarations[typeName];
    }
  }
  return null;
}

describe("Интерфейс UserProfileProps:", function () {
  it("FT-R1-1.1: Создан интерфейс UserProfileProps", function () {
    const propsInterface = getTypeOrInterfaceInfo("UserProfileProps");
    assert.ok(
      propsInterface,
      "Интерфейс UserProfileProps должен быть создан в файле main.tsx."
    );
  });

  it("FT-R1-1.2: Интерфейс UserProfileProps содержит поле 'name' типа 'string'", function () {
    const propsInterface = getTypeOrInterfaceInfo("UserProfileProps");
    assert.ok(propsInterface, "Интерфейс UserProfileProps не найден.");
    assert.ok(
      propsInterface.properties,
      "Свойства (properties) не найдены в интерфейсе UserProfileProps."
    );
    const namePropertyType = propsInterface.properties.name;
    assert.strictEqual(
      typeof namePropertyType,
      "string",
      `Тип значения для свойства 'name' (${namePropertyType}) должен быть string.`
    );
    assert.strictEqual(
      namePropertyType,
      "string",
      `Поле 'name' в UserProfileProps должно быть типа string. Получено: ${namePropertyType}`
    );
  });

  it("FT-R1-1.3: Интерфейс UserProfileProps содержит поле 'age' типа 'number'", function () {
    const propsInterface = getTypeOrInterfaceInfo("UserProfileProps");
    assert.ok(propsInterface, "Интерфейс UserProfileProps не найден.");
    assert.ok(
      propsInterface.properties,
      "Свойства (properties) не найдены в интерфейсе UserProfileProps."
    );
    const agePropertyType = propsInterface.properties.age;
    assert.strictEqual(
      typeof agePropertyType,
      "string",
      `Тип значения для свойства 'age' (${agePropertyType}) должен быть string (описывающий тип 'number').`
    );
    assert.strictEqual(
      agePropertyType,
      "number",
      `Поле 'age' в UserProfileProps должно быть типа number. Получено: ${agePropertyType}`
    );
  });

  it("FT-R1-1.4: Интерфейс UserProfileProps содержит опциональное поле 'email' типа 'string'", function () {
    const propsInterface = getTypeOrInterfaceInfo("UserProfileProps");
    assert.ok(propsInterface, "Интерфейс UserProfileProps не найден.");
    assert.ok(
      propsInterface.properties,
      "Свойства (properties) не найдены в интерфейсе UserProfileProps."
    );
    const emailPropertyType = propsInterface.properties.email;
    assert.strictEqual(
      typeof emailPropertyType,
      "string",
      `Тип значения для свойства 'email' (${emailPropertyType}) должен быть string.`
    );
    assert.strictEqual(
      emailPropertyType,
      "string",
      `Поле 'email' в UserProfileProps должно быть типа string. Получено: ${emailPropertyType}`
    );

    // Используем новое поле propertyDetails для проверки опциональности
    assert.ok(
      propsInterface.propertyDetails,
      "Детальная информация о свойствах (propertyDetails) не найдена в интерфейсе UserProfileProps."
    );
    const emailPropertyDetail = propsInterface.propertyDetails.find(
      (prop) => prop.name === "email"
    );
    assert.ok(
      emailPropertyDetail,
      "Детальная информация о поле 'email' не найдена."
    );
    assert.strictEqual(
      emailPropertyDetail.optional,
      true,
      "Поле 'email' в UserProfileProps должно быть опциональным (email?: string)."
    );
  });
});

describe("Компонент UserProfile:", function () {
  it("FT-R1-2.1: Создан и экспортирован по умолчанию компонент UserProfile", function () {
    const component = getComponentInfo("UserProfile");
    assert.ok(
      component,
      "Компонент UserProfile не найден. Убедитесь, что он создан и экспортирован по умолчанию из main.tsx (export default UserProfile)."
    );

    let isDefaultExported = false;
    if (allVariables.exports) {
      if (
        allVariables.exports.default &&
        (allVariables.exports.default.name === "UserProfile" ||
          allVariables.exports.default.id === "UserProfile" ||
          allVariables.exports.default === "UserProfile")
      ) {
        isDefaultExported = true;
      } else if (Array.isArray(allVariables.exports)) {
        isDefaultExported = allVariables.exports.some(
          (exp) =>
            (exp.isDefaultExport || exp.default) &&
            exp.exportedName === "UserProfile"
        );
      } else if (
        typeof allVariables.exports === "object" &&
        allVariables.exports.default === "UserProfile"
      ) {
        isDefaultExported = true;
      }
    }
    assert.ok(
      isDefaultExported,
      "Компонент UserProfile должен быть экспортирован по умолчанию (export default UserProfile)."
    );
  });

  it("FT-R1-2.2: Компонент UserProfile является FunctionComponent и использует UserProfileProps", function () {
    const component = getComponentInfo("UserProfile");
    assert.ok(component, "Компонент UserProfile не найден.");

    // Используем новое поле typeSignature
    const typeSignature = component.typeSignature || "";
    assert.ok(
      typeSignature,
      "Не удалось определить typeSignature компонента UserProfile."
    );

    const usesUserProfileProps = typeSignature.includes("UserProfileProps");
    const isFunctionComponent =
      typeSignature.includes("FunctionComponent") ||
      typeSignature.includes("FC");

    assert.ok(
      isFunctionComponent,
      "Компонент UserProfile должен быть типизирован как FunctionComponent или React.FC (например, const UserProfile: FunctionComponent<...> = ...)."
    );
    assert.ok(
      usesUserProfileProps,
      "Компонент UserProfile должен использовать интерфейс UserProfileProps в своей типизации (например, FunctionComponent<UserProfileProps>)."
    );

    // Проверяем импорт FunctionComponent
    let fcImported = false;
    if (
      allVariables.imports &&
      allVariables.imports.react &&
      allVariables.imports.react.namedImports
    ) {
      fcImported = allVariables.imports.react.namedImports.some(
        (imp) => imp.name === "FunctionComponent" || imp.name === "FC"
      );
    }
    if (
      !fcImported &&
      allVariables.imports &&
      allVariables.imports.react &&
      allVariables.imports.react.imports
    ) {
      fcImported = allVariables.imports.react.imports.some(
        (imp) => imp.name === "FunctionComponent" || imp.name === "FC"
      );
    }
    assert.ok(
      fcImported,
      "Тип FunctionComponent или FC должен быть импортирован из 'react'. Проверьте импорты в main.tsx."
    );
  });

  it("FT-R1-2.3: Компонент UserProfile корректно отображает 'name' и 'age' в JSX", function () {
    const component = getComponentInfo("UserProfile");
    assert.ok(component, "Компонент UserProfile не найден.");

    let jsxContent = component.content || component.body || "";
    if (
      component.node &&
      component.node.body &&
      typeof component.node.body === "object"
    ) {
      jsxContent = JSON.stringify(component.node.body);
    } else if (
      component.astNode &&
      component.astNode.body &&
      typeof component.astNode.body === "object"
    ) {
      jsxContent = JSON.stringify(component.astNode.body);
    } else if (
      component.implementation &&
      component.implementation.body &&
      typeof component.implementation.body === "object"
    ) {
      jsxContent = JSON.stringify(component.implementation.body);
    }

    assert.ok(
      jsxContent,
      "Не удалось получить содержимое (JSX) компонента UserProfile для анализа. Проверьте поля content, body, node.body, astNode.body или implementation.body в объекте компонента."
    );

    const nameUsed =
      jsxContent.includes("{name}") || jsxContent.includes("props.name");
    const ageUsed =
      jsxContent.includes("{age}") || jsxContent.includes("props.age");

    assert.ok(
      nameUsed,
      "Компонент UserProfile должен отображать свойство 'name' из props (например, {name} или {props.name})."
    );
    assert.ok(
      ageUsed,
      "Компонент UserProfile должен отображать свойство 'age' из props (например, {age} или {props.age})."
    );
  });

  it("FT-R1-2.4: Компонент UserProfile условно отображает 'email' в JSX", function () {
    const component = getComponentInfo("UserProfile");
    assert.ok(component, "Компонент UserProfile не найден.");

    let jsxContent = component.content || component.body || "";
    if (
      component.node &&
      component.node.body &&
      typeof component.node.body === "object"
    ) {
      jsxContent = JSON.stringify(component.node.body);
    } else if (
      component.astNode &&
      component.astNode.body &&
      typeof component.astNode.body === "object"
    ) {
      jsxContent = JSON.stringify(component.astNode.body);
    } else if (
      component.implementation &&
      component.implementation.body &&
      typeof component.implementation.body === "object"
    ) {
      jsxContent = JSON.stringify(component.implementation.body);
    }
    assert.ok(
      jsxContent,
      "Не удалось получить содержимое (JSX) компонента UserProfile для анализа."
    );

    const emailConditionPresent =
      jsxContent.includes("{email &&") || jsxContent.includes("props.email &&");
    const emailValueRendered =
      jsxContent.includes("{email}") || jsxContent.includes("props.email");

    assert.ok(
      emailConditionPresent && emailValueRendered,
      "Компонент UserProfile должен условно отображать 'email', используя логическое И (&&). Ожидается конструкция типа {email && <p>Email: {email}</p>}."
    );
  });
});
