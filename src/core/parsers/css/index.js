const csstree = require("css-tree");
const postcss = require("postcss");
const fs = require("fs");
const path = require("path");

function parseCSS(filePaths) {
  const metadata = {
    selectors: [],
    classes: {},
    ids: {},
    elements: {},
    pseudoClasses: {},
    allProperties: [],
    variables: {},
    mediaQueries: {},
    imports: [],
    exports: [],
    keyframes: {},
    atRules: {},
  };

  filePaths.forEach((filePath) => {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const ast = csstree.parse(content);

      csstree.walk(ast, function (node) {
        switch (node.type) {
          case "Rule":
            extractRuleWithProperties(node, metadata, null);
            break;
          case "Atrule":
            handleAtRule(node, metadata, filePath);
            break;
        }
      });

      if (isCSSModule(filePath)) {
        extractCSSModuleExports(content, metadata, filePath);
      }
    } catch (error) {
      console.warn(`Ошибка парсинга CSS файла ${filePath}:`, error.message);
    }
  });

  return metadata;
}

function extractRuleWithProperties(rule, metadata, mediaContext = null) {
  if (!rule.prelude || rule.prelude.type !== "SelectorList") {
    return;
  }

  const ruleData = {
    selectors: [],
    properties: {},
    context: mediaContext,
  };

  if (rule.prelude.children) {
    rule.prelude.children.forEach((selector) => {
      const selectorString = csstree.generate(selector);
      ruleData.selectors.push(selectorString);

      csstree.walk(selector, function (node) {
        if (node.type === "ClassSelector") {
          const className = node.name;
          if (!metadata.classes[className]) {
            metadata.classes[className] = {
              name: className,
              selector: `.${className}`,
              properties: {},
              pseudoClasses: {},
              mediaQueries: {},
              context: [],
            };
          }
        } else if (node.type === "IdSelector") {
          const idName = node.name;
          if (!metadata.ids[idName]) {
            metadata.ids[idName] = {
              name: idName,
              selector: `#${idName}`,
              properties: {},
              pseudoClasses: {},
              mediaQueries: {},
              context: [],
            };
          }
        } else if (node.type === "TypeSelector") {
          const elementName = node.name;
          if (!metadata.elements[elementName]) {
            metadata.elements[elementName] = {
              name: elementName,
              selector: elementName,
              properties: {},
              pseudoClasses: {},
              mediaQueries: {},
              context: [],
            };
          }
        } else if (node.type === "PseudoClassSelector") {
          const pseudoName = node.name;
          if (!metadata.pseudoClasses[pseudoName]) {
            metadata.pseudoClasses[pseudoName] = {
              name: pseudoName,
              properties: {},
              contexts: [],
            };
          }
        }
      });
    });
  }

  if (rule.block && rule.block.children) {
    rule.block.children.forEach((declaration) => {
      if (declaration.type === "Declaration") {
        const property = declaration.property;
        const value = csstree.generate(declaration.value);

        ruleData.properties[property] = value;
        metadata.allProperties.push(property);

        if (property.startsWith("--")) {
          if (!metadata.variables[property]) {
            metadata.variables[property] = {
              name: property,
              value: value.trim(),
              usedIn: [],
            };
          } else {
            metadata.variables[property].value = value.trim();
          }
        }

        if (value.includes("var(")) {
          const varMatches = value.match(/var\(([^)]+)\)/g);
          if (varMatches) {
            varMatches.forEach((varMatch) => {
              const varName = varMatch.match(/var\(([^,)]+)/)[1].trim();
              if (!metadata.variables[varName]) {
                metadata.variables[varName] = {
                  name: varName,
                  value: null,
                  usedIn: [],
                };
              }
              metadata.variables[varName].usedIn.push({
                selector: ruleData.selectors,
                property: property,
                context: mediaContext,
              });
            });
          }
        }
      }
    });
  }

  ruleData.selectors.forEach((selector) => {
    const selectorData = parseSelectorDetail(selector);

    if (selectorData.type === "class") {
      const className = selectorData.name;
      if (metadata.classes[className]) {
        if (mediaContext) {
          if (!metadata.classes[className].mediaQueries[mediaContext]) {
            metadata.classes[className].mediaQueries[mediaContext] = {};
          }
          Object.assign(
            metadata.classes[className].mediaQueries[mediaContext],
            ruleData.properties
          );
        } else if (selectorData.pseudoClass) {
          if (
            !metadata.classes[className].pseudoClasses[selectorData.pseudoClass]
          ) {
            metadata.classes[className].pseudoClasses[
              selectorData.pseudoClass
            ] = {};
          }
          Object.assign(
            metadata.classes[className].pseudoClasses[selectorData.pseudoClass],
            ruleData.properties
          );
        } else {
          Object.keys(ruleData.properties).forEach((prop) => {
            if (!metadata.classes[className].properties[prop]) {
              metadata.classes[className].properties[prop] =
                ruleData.properties[prop];
            }
          });
        }
        metadata.classes[className].context.push({
          media: mediaContext,
          pseudo: selectorData.pseudoClass,
          properties: Object.keys(ruleData.properties),
        });
      }
    } else if (selectorData.type === "id") {
      const idName = selectorData.name;
      if (metadata.ids[idName]) {
        if (mediaContext) {
          if (!metadata.ids[idName].mediaQueries[mediaContext]) {
            metadata.ids[idName].mediaQueries[mediaContext] = {};
          }
          Object.assign(
            metadata.ids[idName].mediaQueries[mediaContext],
            ruleData.properties
          );
        } else if (selectorData.pseudoClass) {
          if (!metadata.ids[idName].pseudoClasses[selectorData.pseudoClass]) {
            metadata.ids[idName].pseudoClasses[selectorData.pseudoClass] = {};
          }
          Object.assign(
            metadata.ids[idName].pseudoClasses[selectorData.pseudoClass],
            ruleData.properties
          );
        } else {
          Object.keys(ruleData.properties).forEach((prop) => {
            if (!metadata.ids[idName].properties[prop]) {
              metadata.ids[idName].properties[prop] = ruleData.properties[prop];
            }
          });
        }
        metadata.ids[idName].context.push({
          media: mediaContext,
          pseudo: selectorData.pseudoClass,
          properties: Object.keys(ruleData.properties),
        });
      }
    } else if (selectorData.type === "element") {
      const elementName = selectorData.name;
      if (metadata.elements[elementName]) {
        if (mediaContext) {
          if (!metadata.elements[elementName].mediaQueries[mediaContext]) {
            metadata.elements[elementName].mediaQueries[mediaContext] = {};
          }
          Object.assign(
            metadata.elements[elementName].mediaQueries[mediaContext],
            ruleData.properties
          );
        } else if (selectorData.pseudoClass) {
          if (
            !metadata.elements[elementName].pseudoClasses[
              selectorData.pseudoClass
            ]
          ) {
            metadata.elements[elementName].pseudoClasses[
              selectorData.pseudoClass
            ] = {};
          }
          Object.assign(
            metadata.elements[elementName].pseudoClasses[
              selectorData.pseudoClass
            ],
            ruleData.properties
          );
        } else {
          Object.keys(ruleData.properties).forEach((prop) => {
            if (!metadata.elements[elementName].properties[prop]) {
              metadata.elements[elementName].properties[prop] =
                ruleData.properties[prop];
            }
          });
        }
        metadata.elements[elementName].context.push({
          media: mediaContext,
          pseudo: selectorData.pseudoClass,
          properties: Object.keys(ruleData.properties),
        });
      }
    }
  });

  metadata.selectors.push(...ruleData.selectors);
}

function parseSelectorDetail(selector) {
  if (selector.startsWith(".")) {
    const parts = selector.substring(1).split(":");
    return {
      type: "class",
      name: parts[0],
      pseudoClass: parts[1] || null,
    };
  } else if (selector.startsWith("#")) {
    const parts = selector.substring(1).split(":");
    return {
      type: "id",
      name: parts[0],
      pseudoClass: parts[1] || null,
    };
  } else {
    const parts = selector.split(":");
    return {
      type: "element",
      name: parts[0],
      pseudoClass: parts[1] || null,
    };
  }
}

function handleAtRule(atrule, metadata, filePath) {
  switch (atrule.name) {
    case "import":
      if (atrule.prelude) {
        const importValue = csstree.generate(atrule.prelude);
        metadata.imports.push({
          value: importValue,
          file: filePath,
        });
      }
      break;
    case "media":
      if (atrule.prelude) {
        const mediaQuery = csstree.generate(atrule.prelude);
        if (!metadata.mediaQueries[mediaQuery]) {
          metadata.mediaQueries[mediaQuery] = {
            query: mediaQuery,
            rules: [],
            classes: {},
            ids: {},
            elements: {},
          };
        }

        if (atrule.block && atrule.block.children) {
          atrule.block.children.forEach((child) => {
            if (child.type === "Rule") {
              extractRuleWithProperties(child, metadata, mediaQuery);
              metadata.mediaQueries[mediaQuery].rules.push(
                csstree.generate(child)
              );
            }
          });
        }
      }
      break;
    case "keyframes":
      if (atrule.prelude) {
        const keyframeName = csstree.generate(atrule.prelude);
        metadata.keyframes[keyframeName] = {
          name: keyframeName,
          frames: {},
        };

        if (atrule.block && atrule.block.children) {
          atrule.block.children.forEach((child) => {
            if (child.type === "Rule") {
              const frameSelector = csstree.generate(child.prelude);
              metadata.keyframes[keyframeName].frames[frameSelector] = {};

              if (child.block && child.block.children) {
                child.block.children.forEach((declaration) => {
                  if (declaration.type === "Declaration") {
                    const property = declaration.property;
                    const value = csstree.generate(declaration.value);
                    metadata.keyframes[keyframeName].frames[frameSelector][
                      property
                    ] = value;
                  }
                });
              }
            }
          });
        }
      }
      break;
    default:
      if (!metadata.atRules[atrule.name]) {
        metadata.atRules[atrule.name] = [];
      }
      metadata.atRules[atrule.name].push({
        prelude: atrule.prelude ? csstree.generate(atrule.prelude) : null,
        block: atrule.block ? csstree.generate(atrule.block) : null,
      });
      break;
  }
}

function isCSSModule(filePath) {
  return (
    filePath.includes(".module.css") ||
    filePath.includes(".module.scss") ||
    filePath.includes(".module.sass")
  );
}

function extractCSSModuleExports(content, metadata, filePath) {
  Object.keys(metadata.classes).forEach((className) => {
    if (!metadata.exports.includes(className)) {
      metadata.exports.push(className);
    }
  });
}

module.exports = {
  parseCSS,
};
