module.exports = `// Type definitions for reflect-metadata

declare global {
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
  }
}

export {};`;
