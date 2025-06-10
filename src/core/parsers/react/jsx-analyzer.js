const t = require("@babel/types");

function analyzeJSX(functionBody) {
  const jsxInfo = {
    elements: [],
    attributes: {},
    eventHandlers: {},
    functionCalls: [],
    spreadOperators: [],
  };

  traverse(functionBody, jsxInfo);
  return jsxInfo;
}

function traverse(node, jsxInfo) {
  if (!node || typeof node !== "object") return;

  if (t.isJSXElement(node)) {
    analyzeJSXElement(node, jsxInfo);
  }

  if (t.isCallExpression(node)) {
    analyzeFunctionCall(node, jsxInfo);
  }

  for (const key in node) {
    if (
      key === "parent" ||
      key === "leadingComments" ||
      key === "trailingComments"
    ) {
      continue;
    }

    const child = node[key];
    if (Array.isArray(child)) {
      child.forEach((item) => traverse(item, jsxInfo));
    } else if (child && typeof child === "object") {
      traverse(child, jsxInfo);
    }
  }
}

function analyzeJSXElement(element, jsxInfo) {
  const tagName = getJSXElementName(element);

  const elementInfo = {
    type: tagName,
    attributes: {},
    eventHandlers: {},
    spreadAttributes: [],
  };

  if (element.openingElement && element.openingElement.attributes) {
    element.openingElement.attributes.forEach((attr) => {
      if (t.isJSXAttribute(attr)) {
        const attrName = attr.name.name;
        const attrValue = analyzeJSXAttributeValue(attr.value);

        if (attrName.startsWith("on") && attrName.length > 2) {
          elementInfo.eventHandlers[attrName] = attrValue;
          jsxInfo.eventHandlers[attrName] =
            jsxInfo.eventHandlers[attrName] || [];
          jsxInfo.eventHandlers[attrName].push({
            element: tagName,
            handler: attrValue,
          });
        } else {
          elementInfo.attributes[attrName] = attrValue;
        }
      } else if (t.isJSXSpreadAttribute(attr)) {
        const spreadInfo = analyzeSpreadAttribute(attr);
        elementInfo.spreadAttributes.push(spreadInfo);
        jsxInfo.spreadOperators.push({
          element: tagName,
          ...spreadInfo,
        });
      }
    });
  }

  if (!jsxInfo.attributes[tagName]) {
    jsxInfo.attributes[tagName] = [];
  }
  jsxInfo.attributes[tagName].push(elementInfo.attributes);

  jsxInfo.elements.push(elementInfo);
}

function getJSXElementName(element) {
  if (element.openingElement && element.openingElement.name) {
    const name = element.openingElement.name;
    if (t.isJSXIdentifier(name)) {
      return name.name;
    } else if (t.isJSXMemberExpression(name)) {
      return `${name.object.name}.${name.property.name}`;
    }
  }
  return "unknown";
}

function analyzeJSXAttributeValue(value) {
  if (!value) return { type: "boolean", value: true };

  if (t.isStringLiteral(value)) {
    return { type: "string", value: value.value };
  } else if (t.isJSXExpressionContainer(value)) {
    return analyzeJSXExpression(value.expression);
  } else if (t.isJSXElement(value)) {
    return { type: "jsx", value: getJSXElementName(value) };
  }

  return { type: "unknown", value: null };
}

function analyzeJSXExpression(expression) {
  if (t.isStringLiteral(expression)) {
    return { type: "string", value: expression.value };
  } else if (t.isNumericLiteral(expression)) {
    return { type: "number", value: expression.value };
  } else if (t.isBooleanLiteral(expression)) {
    return { type: "boolean", value: expression.value };
  } else if (t.isIdentifier(expression)) {
    return { type: "identifier", value: expression.name };
  } else if (
    t.isArrowFunctionExpression(expression) ||
    t.isFunctionExpression(expression)
  ) {
    return { type: "function", value: "anonymous" };
  } else if (t.isCallExpression(expression)) {
    return analyzeFunctionCallInExpression(expression);
  } else if (t.isMemberExpression(expression)) {
    return analyzeMemberExpression(expression);
  }

  return { type: "expression", value: "complex" };
}

function analyzeSpreadAttribute(attr) {
  const expression = attr.argument;

  if (t.isCallExpression(expression)) {
    return {
      type: "functionCall",
      function: analyzeFunctionCallInExpression(expression),
    };
  } else if (t.isIdentifier(expression)) {
    return {
      type: "identifier",
      name: expression.name,
    };
  } else if (t.isMemberExpression(expression)) {
    return {
      type: "memberExpression",
      object: analyzeMemberExpression(expression),
    };
  }

  return { type: "unknown" };
}

function analyzeFunctionCall(callExpression, jsxInfo) {
  const functionInfo = analyzeFunctionCallInExpression(callExpression);
  jsxInfo.functionCalls.push(functionInfo);
}

function analyzeFunctionCallInExpression(callExpression) {
  let functionName = "unknown";

  if (t.isIdentifier(callExpression.callee)) {
    functionName = callExpression.callee.name;
  } else if (t.isMemberExpression(callExpression.callee)) {
    const memberInfo = analyzeMemberExpression(callExpression.callee);
    functionName = memberInfo.fullPath;
  }

  const args = callExpression.arguments.map((arg) => analyzeArgument(arg));

  return {
    type: "functionCall",
    name: functionName,
    arguments: args,
    argumentCount: args.length,
  };
}

function analyzeMemberExpression(memberExpression) {
  let object = "unknown";
  let property = "unknown";

  if (t.isIdentifier(memberExpression.object)) {
    object = memberExpression.object.name;
  } else if (t.isMemberExpression(memberExpression.object)) {
    const nested = analyzeMemberExpression(memberExpression.object);
    object = nested.fullPath;
  }

  if (t.isIdentifier(memberExpression.property)) {
    property = memberExpression.property.name;
  }

  return {
    type: "memberExpression",
    object,
    property,
    fullPath: `${object}.${property}`,
  };
}

function analyzeArgument(arg) {
  if (t.isStringLiteral(arg)) {
    return { type: "string", value: arg.value };
  } else if (t.isNumericLiteral(arg)) {
    return { type: "number", value: arg.value };
  } else if (t.isBooleanLiteral(arg)) {
    return { type: "boolean", value: arg.value };
  } else if (t.isObjectExpression(arg)) {
    return analyzeObjectArgument(arg);
  } else if (t.isIdentifier(arg)) {
    return { type: "identifier", value: arg.name };
  } else if (t.isTemplateLiteral(arg)) {
    return analyzeTemplateLiteral(arg);
  } else if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
    return { type: "function", value: "anonymous" };
  }

  return { type: "unknown", value: null };
}

function analyzeObjectArgument(objExpression) {
  const properties = {};

  objExpression.properties.forEach((prop) => {
    if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
      const key = prop.key.name;
      properties[key] = analyzeArgument(prop.value);
    }
  });

  return {
    type: "object",
    properties,
  };
}

// Анализирует template literal (например, `ingredients.${index}.name`)
function analyzeTemplateLiteral(templateLiteral) {
  const parts = [];

  // Добавляем статические части
  templateLiteral.quasis.forEach((quasi, index) => {
    if (quasi.value.raw) {
      parts.push({ type: "string", value: quasi.value.raw });
    }

    // Добавляем выражения между статическими частями
    if (index < templateLiteral.expressions.length) {
      const expr = templateLiteral.expressions[index];
      parts.push(analyzeJSXExpression(expr));
    }
  });

  // Создаем полную строку
  const fullValue = parts
    .map((part) => (part.type === "string" ? part.value : `\${${part.value}}`))
    .join("");

  return {
    type: "templateLiteral",
    value: fullValue,
    parts,
  };
}

module.exports = {
  analyzeJSX,
};
