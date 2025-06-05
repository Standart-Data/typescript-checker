/**
 * reflect-metadata модуль - side-effect импорт, расширяет глобальный Reflect
 */

const MODULE_NAME = "reflect-metadata";

const GLOBAL_TYPES = `
  namespace Reflect {
    function defineMetadata(metadataKey: any, metadataValue: any, target: any): void;
    function defineMetadata(metadataKey: any, metadataValue: any, target: any, propertyKey: string | symbol): void;
    function hasMetadata(metadataKey: any, target: any): boolean;
    function hasMetadata(metadataKey: any, target: any, propertyKey: string | symbol): boolean;
    function hasOwnMetadata(metadataKey: any, target: any): boolean;
    function hasOwnMetadata(metadataKey: any, target: any, propertyKey: string | symbol): boolean;
    function getMetadata(metadataKey: any, target: any): any;
    function getMetadata(metadataKey: any, target: any, propertyKey: string | symbol): any;
    function getOwnMetadata(metadataKey: any, target: any): any;
    function getOwnMetadata(metadataKey: any, target: any, propertyKey: string | symbol): any;
    function getMetadataKeys(target: any): any[];
    function getMetadataKeys(target: any, propertyKey: string | symbol): any[];
    function getOwnMetadataKeys(target: any): any[];
    function getOwnMetadataKeys(target: any, propertyKey: string | symbol): any[];
    function deleteMetadata(metadataKey: any, target: any): boolean;
    function deleteMetadata(metadataKey: any, target: any, propertyKey: string | symbol): boolean;
  }`;

/**
 * Проверяет, является ли импорт side-effect импортом для данного модуля
 * @param {string} importLine - строка импорта
 * @returns {boolean}
 */
function isSideEffectImport(importLine) {
  const trimmedLine = importLine.trim();
  const sideEffectMatch = trimmedLine.match(/^import\s+['"]([^'"]+)['"];?\s*$/);
  return sideEffectMatch && sideEffectMatch[1] === MODULE_NAME;
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
  isSideEffectImport,
  getGlobalTypes,
};
