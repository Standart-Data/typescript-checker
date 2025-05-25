// Упражнение: модификаторы в TypeScript
// Задача: правильно определить все модификаторы конструкций языка

// Различные типы объявления переменных
var globalVar: string = "global";
let mutableVar: number = 42;
const immutableVar: boolean = true;

// Экспортируемые переменные
export var exportedVar: string = "exported";
export let exportedLet: number = 100;
export const exportedConst: boolean = false;

// Объявления переменных (declare)
declare var declaredVar: string;
declare let declaredLet: number;
declare const declaredConst: boolean;

// Функции с модификаторами
async function asyncFunction(): Promise<void> {
  return Promise.resolve();
}

function* generatorFunction(): Generator<number> {
  yield 1;
  yield 2;
}

export function exportedFunction(): void {}

export default function defaultFunction(): void {}

declare function declaredFunction(): void;

// Абстрактный класс с модификаторами
abstract class AbstractBase {
  // Свойства с различными модификаторами доступа
  public publicProperty: string = "public";
  private privateProperty: string = "private";
  protected protectedProperty: string = "protected";
  readonly readonlyProperty: string = "readonly";
  static staticProperty: string = "static";
  abstract abstractProperty: string;

  // Методы с различными модификаторами
  public publicMethod(): void {}
  private privateMethod(): void {}
  protected protectedMethod(): void {}
  static staticMethod(): void {}
  async asyncMethod(): Promise<void> {
    return Promise.resolve();
  }
  abstract abstractMethod(): void;

  // Конструктор с параметрами-свойствами
  constructor(
    public constructorPublic: string,
    private constructorPrivate: number,
    protected constructorProtected: boolean
  ) {}
}

// Обычный класс с наследованием
class ConcreteClass extends AbstractBase {
  // Переопределение абстрактного свойства
  abstractProperty: string = "implemented";

  // Переопределение абстрактного метода
  abstractMethod(): void {
    console.log("Abstract method implemented");
  }

  // Метод с override (если поддерживается)
  override publicMethod(): void {
    super.publicMethod();
  }
}

// Экспортируемый класс
export class ExportedClass {
  exportedProperty: string = "exported";
}

// Экспортируемый абстрактный класс
export abstract class ExportedAbstractClass {
  abstract exportedAbstractProperty: string;
  abstract exportedAbstractMethod(): void;
}

// Интерфейсы
interface LocalInterface {
  property: string;
}

export interface ExportedInterface {
  exportedProperty: string;
}

declare interface DeclaredInterface {
  declaredProperty: string;
}

// Типы
type LocalType = string | number;

export type ExportedType = boolean | null;

declare type DeclaredType = object;

// Enum с модификаторами
enum LocalEnum {
  Value1,
  Value2,
}

export enum ExportedEnum {
  ExportedValue1,
  ExportedValue2,
}

const enum LocalConstEnum {
  ConstValue1 = "const1",
  ConstValue2 = "const2",
}

export const enum ExportedConstEnum {
  ExportedConstValue1 = "exported1",
  ExportedConstValue2 = "exported2",
}

declare enum DeclaredEnum {
  DeclaredValue1,
  DeclaredValue2,
}

// Использование различных конструкций
const instance = new ConcreteClass("public", 42, true);
const exportedInstance = new ExportedClass();
const enumValue = LocalEnum.Value1;
const constEnumValue = LocalConstEnum.ConstValue1;
