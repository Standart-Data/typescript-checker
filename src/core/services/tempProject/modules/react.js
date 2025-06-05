/**
 * React модуль - добавляет глобальные JSX типы при импорте React
 */

const MODULE_NAME = "react";

const GLOBAL_TYPES = `
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }

    interface IntrinsicAttributes extends React.Attributes { }
    interface IntrinsicClassAttributes<T> extends React.Attributes {
      ref?: React.Ref<T>;
    }

    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }`;

/**
 * Проверяет, является ли импорт обычным импортом для данного модуля
 * @param {string} importLine - строка импорта
 * @returns {boolean}
 */
function isRegularImport(importLine) {
  const trimmedLine = importLine.trim();
  // Ищем любой импорт React: import React, import { xxx } from 'react', import * as React from 'react'
  const importMatch = trimmedLine.match(
    /^import\s+(?:(?:\*\s+as\s+\w+)|(?:\{[^}]*\})|(?:\w+(?:\s*,\s*\{[^}]*\})?))?\s+from\s+['"]([^'"]+)['"];?\s*$/
  );
  return importMatch && importMatch[1] === MODULE_NAME;
}

/**
 * Возвращает глобальные типы для модуля
 * @returns {string}
 */
function getGlobalTypes() {
  return GLOBAL_TYPES;
}

/**
 * Имя модуля
 * @returns {string}
 */
function getModuleName() {
  return MODULE_NAME;
}

module.exports = {
  getModuleName,
  isRegularImport,
  getGlobalTypes,
};
